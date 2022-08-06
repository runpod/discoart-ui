import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fetch from "node-fetch"

import { getAuth } from "@utils/getAuth"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const database = await db

    const response = await (await fetch("http://localhost:9999/status")).json()

    const activeJobs = response?.activeProcesses

    let processMapById = {}

    activeJobs.forEach((job) => {
      processMapById[job?.id] = job
    })

    const jobs = await database.all(
      `
        SELECT * from jobs
          WHERE should_process = 1
          AND show_queue = 1
      `
    )

    const hydratedJobs = jobs.map((job) => {
      if (processMapById[job?.job_id]) {
        return { ...job, processing: true }
      } else return job
    })

    res.status(200).json({
      success: true,
      jobs: hydratedJobs,
    })
  } catch (e) {
    console.log("error", e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
