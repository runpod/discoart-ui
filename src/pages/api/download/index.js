import { getAuth } from "@utils/getAuth"
import { readFile } from "fs/promises"
const Archiver = require("archiver")
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import glob from "glob"
import { format } from "date-fns"

import { databasePath } from "@utils/constants"

export const config = {
  api: {
    responseLimit: false,
  },
}

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  const { all } = req.query

  if (!all) res.status(502)

  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const files = await new Promise((resolve, reject) => {
      glob("/workspace/out/**/*", (err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })

    const finals = files
      ?.filter((fileName) => fileName.includes("done"))
      ?.map((name) => {
        const [, , , jobId, fileName] = name.split("/")
        return { jobId, fileName }
      })

    const batchNameMap = {}

    const settingsFiles = files?.filter((fileName) => fileName.includes("settings"))

    for (let fileName of settingsFiles) {
      const [, , , jobId] = fileName.split("/")

      let rawSettings = await readFile(fileName)
      const settings = JSON.parse(rawSettings)
      const batch_name = settings?.batch_name

      batchNameMap[jobId] = batch_name
    }

    // Tell the browser that this is a zip file.
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-disposition": `attachment; filename=${format(new Date(), "dd_MM_yy")}_runpod.zip`,
    })

    var zip = Archiver("zip")

    // Send the file to the page output.
    zip.pipe(res)

    for (let { fileName, jobId } of finals) {
      const batchName = batchNameMap[jobId]

      const fileLocation = `/workspace/out/${jobId}/`
      zip.file(`${fileLocation}${fileName}`, { name: `${jobId}_${batchName}_${fileName}` })
    }

    for (let [jobId, batchName] of Object.entries(batchNameMap)) {
      const fileLocation = `/workspace/out/${jobId}/`
      zip.file(`${fileLocation}settings.txt`, { name: `${jobId}_${batchName}_settings.txt` })
    }

    zip.finalize()
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
