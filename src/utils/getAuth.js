import { databasePath } from "@utils/constants"

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

    const existingUser = await database.get(`
          SELECT password from users
              WHERE user_name = 'owner'
    `)

    if (!existingUser?.password) {
      return {
        setPassword: true,
        loggedIn: false,
      }
    } else if (existingUser?.password === password) {
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
