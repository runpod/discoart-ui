import sqlite3 from "sqlite3"
import { open } from "sqlite"
import Cookies from "cookies"
import fs from "fs"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const payload = req?.body
    const submittedPassword = payload?.password

    let savedPassword

    try {
      const fileContents = fs.readFileSync("/workspace/password.txt", "utf8")

      savedPassword = fileContents?.trim()
    } catch (e) {}

    if (!savedPassword || submittedPassword?.trim() === savedPassword) {
      fs.writeFile(`/workspace/password.txt`, submittedPassword?.trim(), () =>
        console.log(`new password saved`)
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
    console.log(e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
