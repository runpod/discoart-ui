const path = require("path")
import express from "express"

export const config = {
  api: { externalResolver: true },
}

const handler = express()

const serveFiles = express.static("/workspace/out")

handler.use(["/api/image/", "/image"], serveFiles)

export default handler
