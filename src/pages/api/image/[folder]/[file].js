const path = require("path")
import express from "express"

import { getAuth } from "@utils/getAuth"

export const config = {
  api: { externalResolver: true },
}

const handler = express()

const serveFiles = express.static("/workspace/out")

handler.use(["/api/image/", "/image"], async (req, res, next) => {
  try {
    const { loggedIn } = await getAuth({ req, res })

    if (loggedIn) {
      next()
    } else {
      res.status(401).end()
      return
    }
  } catch (e) {
    res.status(401).end()
    return
  }
})

handler.use(["/api/image/", "/image"], serveFiles)

export default handler
