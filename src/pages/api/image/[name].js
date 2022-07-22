export const config = {
  api: { externalResolver: true },
}

import express from "express"
const handler = express()

const serveFiles = express.static("./out")

handler.use(["/api/image", "/image"], serveFiles)

export default handler
