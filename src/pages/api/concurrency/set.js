import sqlite3 from "sqlite3"
import { open } from "sqlite"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const database = await db

    const payload = JSON.parse(req.body)

    if (payload.maxConcurrency)
      await database.run(
        `
            UPDATE concurrency 
                SET max_concurrency = ?
                WHERE id = ?
       `,
        payload.maxConcurrency,
        "value"
      )

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
