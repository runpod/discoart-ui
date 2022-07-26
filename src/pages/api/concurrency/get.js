import sqlite3 from "sqlite3"
import { open } from "sqlite"
import formidable from "formidable"
import fs from "fs"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const database = await db

    const { max_concurrency } = await database.get(
      `SELECT max_concurrency FROM concurrency where id = ?`,
      "value"
    )

    res.status(200).json({
      success: true,
      maxConcurrency: max_concurrency,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
      maxConcurrency: 1,
    })
  }
}

export default handler
