import { getAuth } from "@utils/getAuth"
import fs from "fs"
const Archiver = require("archiver")
import sqlite3 from "sqlite3"
import { open } from "sqlite"

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
  const { jobId, selectedFileNames, zipName } = req.query

  try {
    const database = await db

    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    let batch_name = "RunPodDisco"

    try {
      const { job_details } = await database.get(
        `
        SELECT job_details FROM jobs
          WHERE job_id = ? 
      `,
        jobId
      )

      batch_name = JSON.parse(job_details) || "RunPodDisco"
    } catch (e) {}

    const fileNames = selectedFileNames.split(",") || []

    const fileLocation = `/workspace/out/${jobId}/`

    if (fileNames.length === 1) {
      const fileName = fileNames[0]
      const fileStream = fs.createReadStream(`${fileLocation}${fileNames[0]}`)

      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-disposition": `attachment; filename=${batch_name}_${fileName}`,
      })

      fileStream.pipe(res)
    } else {
      // Tell the browser that this is a zip file.
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-disposition": `attachment; filename=${zipName || jobId}.zip`,
      })

      var zip = Archiver("zip")

      // Send the file to the page output.
      zip.pipe(res)

      for (let fileName of fileNames) {
        zip.file(`${fileLocation}${fileName}`, { name: `${batch_name}_${fileName}` })
      }

      zip.file(`${fileLocation}settings.txt`, { name: `${batch_name}.settings.txt` })

      zip.finalize()
    }
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
