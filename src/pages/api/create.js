import sqlite3 from "sqlite3"
import { open } from "sqlite"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  const payload = req?.body

  const database = await db

  try {
    await database.run(
      `INSERT INTO jobs (job_id, created_at, job_details, desired_status) 
        VALUES (:job_id, :created_at, :job_details, :desired_status)`,
      {
        ":job_id": payload?.jobId,
        ":created_at": Date.now(),
        ":job_details": JSON.stringify(payload?.parameters),
        ":desired_status": "RUN",
      }
    )

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
