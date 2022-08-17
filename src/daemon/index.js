const { spawn } = require("child_process")
const sqlite3 = require("sqlite3")
const { open } = require("sqlite")
const fs = require("fs")
const { head, range } = require("ramda")
const express = require("express")

const app = express()
const port = 9999

const databasePath = "/workspace/database"

let maxConcurrency = process.env.RUNPOD_GPU_COUNT
let jobStarting = false
let activeProcesses = []

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const setup = async () => {
  console.log("Daemon setup")
  const database = await db

  await database.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      job_id TEXT PRIMARY KEY,
      created_at INTEGER,
      started_at INTEGER,
      completed_at INTEGER,
      job_details TEXT,
      error INTEGER,
      show_gallery INTEGER,
      show_queue INTEGER,
      should_process INTEGER
    )
  `)

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_name TEXT PRIMARY KEY,
      password TEXT
    )
  `)

  await database.exec("ALTER TABLE jobs ADD COLUMN error INTEGER").catch(() => {})
  await database.exec("ALTER TABLE jobs ADD COLUMN show_gallery INTEGER").catch(() => {})
  await database.exec("ALTER TABLE jobs ADD COLUMN show_queue INTEGER").catch(() => {})
  await database.exec("ALTER TABLE jobs ADD COLUMN should_process INTEGER").catch(() => {})

  if (!fs.existsSync(`/workspace/out/`)) {
    fs.mkdirSync(`/workspace/out/`)
  }
  if (!fs.existsSync(`/workspace/logs/`)) {
    fs.mkdirSync(`/workspace/logs/`)
  }
  if (!fs.existsSync(`/workspace/init/`)) {
    fs.mkdirSync(`/workspace/init/`)
  }

  console.log("finding gpu count")

  const job = spawn("bash", ["-c", `python ${__dirname}/getGpuCount.py`], {
    detached: true,
  })

  console.log("max concurrency detected: ", maxConcurrency)

  console.log("Daemon setup complete - start polling")
}

const startJob = async ({ parameters, jobId, gpuIndex }) => {
  jobStarting = true
  setTimeout(() => (jobStarting = false), 30000)
  const database = await db

  console.log(`starting job on GPU CUDA DEVICE ${gpuIndex}`)

  const command = `echo ${JSON.stringify(
    parameters
  )} | WANDB_MODE=disabled DISCOART_OPTOUT_CLOUD_BACKUP='1' DISCOART_MODELS_YAML='/models.yaml' DISCOART_DISABLE_REMOTE_MODELS='1' DISCOART_OUTPUT_DIR=/workspace/out CUDA_VISIBLE_DEVICES=${gpuIndex} python -m discoart create`

  const job = spawn("bash", ["-c", command], { detached: true })

  database.run(
    `
      UPDATE jobs
        SET started_at = ?
      WHERE job_id = ?
    `,
    Date.now(),
    jobId
  )

  let debugStream = fs.createWriteStream(`/workspace/logs/${jobId}.txt`, { flags: "a" })

  const jobInfo = {
    id: jobId,
    gpuIndex,
    pid: job.pid,
    process: job,
    jobDetails: parameters,
    promise: new Promise((resolve, reject) => {
      job.stdout.on("data", (data) => {
        const trimmed = `${data}`.trim()

        // if (trimmed) {
        //   console.log("STDOUT ----------------")
        //   console.log(trimmed)
        //   console.log("STDOUT ----------------")
        // }

        if (trimmed.includes("Traceback")) reject(`${data}`)
      })

      job.stderr.on("data", (data) => {
        const trimmed = `${data}`.trim()

        // if (trimmed) {
        //   console.log("STDERR ----------------")
        //   console.log(trimmed)

        //   console.log("STDERR ----------------")
        // }
        debugStream.write(trimmed + "\n")
        if (data.includes("Traceback") || data.includes("Error")) reject(`${data}`)
      })
      job.on("close", (code) => {
        debugStream.end()
        resolve(code)
      })

      job.on("error", (err) => {
        debugStream.end()
        reject(err)
      })
      job.on("close", (code) => {
        debugStream.end()
        resolve(code)
      })

      job.on("error", (err) => {
        debugStream.end()
        reject(err)
      })
    })
      .then(() => {
        activeProcesses[gpuIndex] = null
        console.log("job completed", jobId)
        database
          .run(
            `
              UPDATE jobs
                SET completed_at = ?,
                error = 0
              WHERE job_id = ?
            `,
            Date.now(),
            jobId
          )
          .catch((err) => {
            console.log(err)
          })
        fs.unlink(`/workspace/out/${jobId}/da.protobuf.lz4`, () => {
          console.log("cleaned up lz4 file")
        })
      })

      .catch((err) => {
        activeProcesses[gpuIndex] = null
        console.log("FATAL ERROR", err)
        database
          .run(
            `
              UPDATE jobs
                SET completed_at = ?,
                error = 1
              WHERE job_id = ?
            `,
            Date.now(),
            jobId
          )
          .catch((err) => {
            console.log("ERROR", err)
          })
        fs.unlink(`/workspace/out/${jobId}/da.protobuf.lz4`, () => {
          console.log("cleaned up lz4 file")
        })
      }),
  }

  return jobInfo
}

const pruneDeletedJobs = async (activeJobs) => {
  try {
    const database = await db

    const queuedJobs = await database.all(`
      SELECT job_id FROM jobs 
        WHERE should_process = 1
    `)

    activeJobs.forEach(({ id, pid }, index) => {
      const matchedJob = queuedJobs.find((job) => job.job_id === id)

      const aboveConcurrency = index + 1 > maxConcurrency

      if (!matchedJob || aboveConcurrency) {
        console.log("killing job", id)
        try {
          process.kill(-pid)
        } catch (e) {
          console.log("failed to kill process", e)
        }
      }
    })
  } catch (e) {
    console.log("error pruning jobs", e)
  }
}

const startDaemon = async () => {
  console.log("Daemon init")
  await setup()
  setInterval(async () => {
    try {
      // console.log("poll loop")
      const database = await db

      const activeJobs = activeProcesses.filter((job) => job)
      const activeJobCount = activeJobs.length

      await pruneDeletedJobs(activeJobs)

      if (activeJobCount < maxConcurrency) {
        const viableJobs = await database.all(
          `
          SELECT job_id, job_details FROM jobs
            WHERE completed_at is null
            AND started_at is null
            AND should_process = 1
            ORDER BY created_at ASC
        `
        )

        const jobsNotInFlight = viableJobs.filter(
          ({ job_id }) => !activeProcesses.map((process) => process && process.id).includes(job_id)
        )

        const nextJob = head(jobsNotInFlight)

        if (nextJob && !jobStarting) {
          const allGpuIndexes = range(0, maxConcurrency)

          const availableGpus = []

          allGpuIndexes.forEach((gpuIndex) => {
            if (!activeProcesses.find((process) => process?.gpuIndex === gpuIndex)) {
              availableGpus.push(gpuIndex)
            }
          })

          const gpuIndex = availableGpus?.[0]

          const jobId = nextJob.job_id

          console.log("starting new job", nextJob.job_details)

          const newJob = await startJob({
            jobId: jobId,
            gpuIndex,
            parameters: nextJob.job_details,
          })

          activeProcesses[gpuIndex] = newJob
        }
      }
    } catch (err) {
      console.log("ERROR", err)
    }
  }, 2000)
}

startDaemon()

app.get("/status", (req, res) => {
  try {
    res.status(200).json({
      activeProcesses: activeProcesses
        ?.filter((job) => job)
        ?.map(({ id, gpuIndex, pid, jobDetails }) => {
          return {
            id,
            gpuIndex,
            pid,
            jobDetails,
          }
        }),
      maxConcurrency,
    })
  } catch (e) {
    res.status(200).json({
      activeProcesses: [],
    })
  }
})

app.get("/kill", (req, res) => {
  try {
    const { jobId } = req?.query

    const job = activeProcesses.find((job) => job.id === jobId)

    if (job) {
      console.log("killing job", id)
      process.kill(-job.pid)
      activeProcesses[job.gpuIndex] = null
    }

    res.status(200).json({ success: true })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
