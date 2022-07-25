import sqlite3 from "sqlite3"
import { open } from "sqlite"
import queuePollerDaemon from "src/daemon"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    queuePollerDaemon()
    const database = await db

    const jobs = await database.all(
      `
        SELECT * from jobs 
    `
    )

    res.status(200).json({
      success: true,
      jobs,
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
