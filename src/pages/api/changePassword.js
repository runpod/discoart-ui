import sqlite3 from "sqlite3"
import { open } from "sqlite"
import Cookies from "cookies"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const payload = req?.body

    const auth = getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const database = await db

    const existingUser = await database.get(`
        SELECT password from users
            WHERE user_name = 'owner'
    `)

    const existingPassword = existingUser?.password

    if (!existingPassword || submittedPassword === existingPassword) {
      const result = await database.run(
        `
        INSERT INTO users (user_name, password) VALUES('owner', ?)
            ON CONFLICT(user_name) DO UPDATE SET password = ?`,
        submittedPassword,
        submittedPassword
      )

      const cookies = new Cookies(req, res)
      // Get a cookie
      cookies.set("password", submittedPassword)

      res.status(200).json({
        success: true,
      })
    } else {
      res.status(200).json({
        success: false,
      })
    }
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
