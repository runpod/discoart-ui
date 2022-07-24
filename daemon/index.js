const { spawn } = require("child_process")
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs"

const databasePath = "/workspace/database"

const maxConcurrency = 1
export let activeProcesses = {}

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

let setupFinished = false

const setup = async () => {
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

  setupFinished = true
}

setup()

const startJob = async ({ parameters, jobId }) => {
  const database = await db

  const command = `echo ${JSON.stringify(parameters)} | python -m discoart create `

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
    pid: job.pid,
    process: job,
    promise: new Promise((resolve, reject) => {
      job.stdout.on("data", (data) => {
        console.log(`STDOUT: ${data}`)
        if (data.includes("ERROR")) reject(`${data}`)
      })

      job.stderr.on("data", (data) => {
        console.error(`ERROR: ${data}`)
        debugStream.write(`${data}`)
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
      .then((code) => {
        delete activeProcesses[jobId]
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
        delete activeProcesses[jobId]
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

  activeJobs.forEach(({ id, pid }) => {
    const matchedJob = queuedJobs.find((job) => job.job_id === id)

    if (!matchedJob) {
      process.kill(-pid)
    }
  })
}

const queuePollerDaemon = async () => {
  setInterval(async () => {
    if (setupFinished) {
      const database = await db

      const allJobs = await database.all(
        `SELECT job_id, created_at, started_at, completed_at FROM jobs
            ORDER BY created_at ASC`
      )

      const activeJobCount = Object.values(activeProcesses).length

      pruneDeletedJobs()

      if (activeJobCount < maxConcurrency) {
        // get next job

        const nextJob = await database.get(
          `
                  SELECT job_id, job_details FROM jobs 
                    WHERE completed_at is null
                    ORDER BY created_at ASC
                `
        )

        if (nextJob) {
          const jobId = nextJob.job_id
          activeProcesses[jobId] = await startJob({
            jobId: jobId,
            parameters: nextJob.job_details,
          })
        }
      }
    }
  }, 10000)
}

queuePollerDaemon()
