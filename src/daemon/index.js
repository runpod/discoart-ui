const { spawn } = require("child_process")
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs"
import { head } from "ramda"

const databasePath = "/workspace/database"

let maxConcurrency = 1
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
      job_details TEXT
    )
  `)

  await database.exec(`
      DROP TABLE concurrency
  `)

  await database.exec(`
    CREATE TABLE IF NOT EXISTS concurrency (
      id TEXT PRIMARY KEY,
      max_concurrency INTEGER
    )
`)

  if (!fs.existsSync(`/workspace/out/`)) {
    fs.mkdirSync(`/workspace/out/`)
  }
  if (!fs.existsSync(`/workspace/logs/`)) {
    fs.mkdirSync(`/workspace/logs/`)
  }
  if (!fs.existsSync(`/workspace/init/`)) {
    fs.mkdirSync(`/workspace/init/`)
  }
  console.log("Daemon setup complete - start polling")
}

const startJob = async ({ parameters, jobId, gpuIndex }) => {
  const database = await db

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

  if (!fs.existsSync(`/workspace/logs/${jobId}/`)) {
    fs.mkdirSync(`/workspace/logs/${jobId}/`)
  }

  let debugStream = fs.createWriteStream(`/workspace/logs/${jobId}.txt`, { flags: "a" })

  const jobInfo = {
    id: jobId,
    gpuIndex,
    pid: job.pid,
    process: job,
    promise: new Promise((resolve, reject) => {
      job.stdout.on("data", (data) => {
        const trimmed = `${data}`.trim()
        if (trimmed) console.log(trimmed)
        if (trimmed.includes("ERROR")) reject(`${data}`)
      })

      job.stderr.on("data", (data) => {
        const trimmed = `${data}`.trim()
        if (trimmed) console.log(trimmed)
        debugStream.write(trimmed)
        if (data.includes("ERROR")) reject(`${data}`)
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
        database
          .run(
            `
              UPDATE jobs
                SET completed_at = ?
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
                SET completed_at = ?
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

const pruneDeletedJobs = async () => {
  const database = await db
  const activeJobs = Object.values(activeProcesses)

  const queuedJobs = await database.all(`SELECT job_id FROM jobs`)

  activeJobs
    .filter((job) => job)
    .forEach(({ id, pid }, index) => {
      const matchedJob = queuedJobs.find((job) => job.job_id === id)

      const aboveConcurrency = index + 1 > maxConcurrency

      if (!matchedJob || aboveConcurrency) {
        process.kill(-pid)
      }
    })
}

const startDaemon = async () => {
  console.log("Daemon init")
  await setup()
  setInterval(async () => {
    const database = await db

    const activeJobCount = activeProcesses.length

    const row = await database.get(`
      SELECT max_concurrency FROM concurrency
    `)

    maxConcurrency = row && row.max_concurrency

    if (!maxConcurrency) {
      maxConcurrency = 1
      database.run(
        `
        INSERT INTO concurrency (id, max_concurrency)
        VALUES (:id, :max_concurrency)`,
        {
          ":id": "value",
          ":max_concurrency": 1,
        }
      )
    }

    pruneDeletedJobs()

    if (activeJobCount < maxConcurrency) {
      const viableJobs = await database.all(
        `
                    SELECT job_id, job_details FROM jobs
                      WHERE completed_at is null
                      ORDER BY created_at ASC
                  `
      )

      const jobsNotInFlight = viableJobs.filter(
        ({ job_id }) => !activeProcesses.map(({ id }) => id).includes(job_id)
      )

      const nextJob = head(jobsNotInFlight)

      if (nextJob) {
        const gpuIndex = activeJobCount

        const jobId = nextJob.job_id

        const newJob = await startJob({
          jobId: jobId,
          gpuIndex,
          parameters: nextJob.job_details,
        })

        activeProcesses[gpuIndex] = newJob
      }
    }
  }, 10000)
}

startDaemon()
