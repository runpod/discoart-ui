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
    const auth = getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    await database.run(
      `
        UPDATE jobs
            SET desired_status = 'CANCEL'
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
