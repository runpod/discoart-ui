import { databasePath } from "@utils/constants"
import fs from "fs"

import sqlite3 from "sqlite3"
import { open } from "sqlite"
import Cookies from "cookies"

export const getAuth = async ({ req, res }) => {
  try {
    const database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    const cookies = new Cookies(req, res)
    // Get a cookie
    const password = cookies.get("password")

    let savedPassword

    try {
      const fileContents = fs.readFileSync("/workspace/password.txt", "utf8")

      savedPassword = fileContents?.trim()
    } catch (e) {}

    if (!savedPassword) {
      return {
        setPassword: true,
        loggedIn: false,
      }
    } else if (savedPassword === password?.trim()) {
      return {
        loggedIn: true,
      }
    } else {
      return {
        loggedIn: false,
      }
    }
  } catch (e) {
    console.log(e)
    return {
      loggedIn: false,
    }
  }
}
