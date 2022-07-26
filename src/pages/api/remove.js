import sqlite3 from "sqlite3"
import { open } from "sqlite"

import { getAuth } from "@utils/getAuth"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  const payload = req?.body

  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const database = await db

    await (await fetch(`http://localhost:9999/kill?jobId=${payload?.jobId}`)).json()

    await database.run(
      `
        DELETE FROM jobs
          WHERE job_id = ?
    `,
      payload?.jobId
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
