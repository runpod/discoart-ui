const { spawn } = require("child_process")
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs"
import { head } from "ramda"

const databasePath = "/workspace/database"

let maxConcurrency = 1
let jobStarting = false
export let activeProcesses = []

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
      error INTEGER
    )
  `)

  await database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_name TEXT PRIMARY KEY,
    password TEXT
  )
`)

  await database.exec("ALTER TABLE jobs ADD COLUMN error INTEGER").catch(() => {})

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

  try {
    maxConcurrency = await new Promise((resolve) => {
      job.stdout.on("data", (data) => {
        try {
          const rawConcurrencyString = `${data}`
          const parsedConcurrency = parseInt(rawConcurrencyString, 10)
          resolve(parsedConcurrency)
        } catch (e) {
          console.log("WARNING, FAILED TO DETECT CONCURRENCY")
          resolve(0)
        }
      })

      job.on("error", () => {
        console.log("WARNING, FAILED TO DETECT CONCURRENCY")
        resolve(0)
      })
    })
  } catch (e) {
    console.log("WARNING, FAILED TO DETECT CONCURRENCY")
    console.log(e)
    maxConcurrency = 0
  }

  console.log("max concurrency detected: ", maxConcurrency)

  console.log("Daemon setup complete - start polling")
}

const startJob = async ({ parameters, jobId, gpuIndex }) => {
  jobStarting = true
  setTimeout(() => (jobStarting = false), 60000)
  const database = await db

  console.log(`starting job on GPU CUDA DEVICE ${gpuIndex}`)

  const command = `echo ${JSON.stringify(
    parameters
  )} | CUDA_VISIBLE_DEVICES=${gpuIndex} python -m discoart create`

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
    promise: new Promise((resolve, reject) => {
      job.stdout.on("data", (data) => {
        const trimmed = `${data}`.trim()
        // if (trimmed) console.log(trimmed)
        if (trimmed.includes("ERROR")) reject(`${data}`)
      })

      job.stderr.on("data", (data) => {
        const trimmed = `${data}`.trim()
        // if (trimmed) console.log(trimmed)
        debugStream.write(trimmed + "\n")
        if (data.includes("ERROR") || data.includes("Error")) reject(`${data}`)
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
      }),
  }

  return jobInfo
}

const pruneDeletedJobs = async (activeJobs) => {
  try {
    const database = await db

    const queuedJobs = await database.all(`SELECT job_id FROM jobs`)

    activeJobs.forEach(({ id, pid }, index) => {
      const matchedJob = queuedJobs.find((job) => job.job_id === id)

      const aboveConcurrency = index + 1 > maxConcurrency

      if (!matchedJob || aboveConcurrency) {
        console.log("killing job", id)
        process.kill(-pid)
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
            ORDER BY created_at ASC
        `
        )

        const jobsNotInFlight = viableJobs.filter(
          ({ job_id }) => !activeProcesses.map((process) => process && process.id).includes(job_id)
        )

        const nextJob = head(jobsNotInFlight)

        if (nextJob && !jobStarting) {
          const gpuIndex = activeJobCount

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
