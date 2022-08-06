import sqlite3 from "sqlite3"
import { open } from "sqlite"
const path = require("path")
import { getAuth } from "@utils/getAuth"
import fetch from "node-fetch"
import { getJobInfo } from "."

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

    const { jobId } = req.query

    const response = await (await fetch("http://localhost:9999/status")).json()

    const activeJobs = response?.activeProcesses

    const matchedJob = activeJobs.find((job) => job.id === jobId)

    jobProgress = await getJobInfo(matchedJob.id, matchedJob.jobDetails)

    res.status(200).json({
      success: true,
      jobProgress,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
      jobProgress: {},
    })
  }
}

export default handler
