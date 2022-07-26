import sqlite3 from "sqlite3"
import { open } from "sqlite"
import formidable from "formidable"
import fs from "fs"

import { getAuth } from "@utils/getAuth"
import { databasePath } from "@utils/constants"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = async (req, res) => {
  try {
    const database = await db

    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const form = new formidable.IncomingForm({
      uploadDir: "/workspace/init/",
    })

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve({
          fields,
          files,
        })
      })
    })

    const parsedFields = JSON.parse(fields?.data)
    const jobId = parsedFields?.jobId

    if (files) {
      const path = files?.file?.filepath
      parsedFields.parameters.init_image = path
    }

    const job_details = JSON.stringify(parsedFields?.parameters)

    if (!fs.existsSync(`/workspace/out/${jobId}/`)) {
      fs.mkdirSync(`/workspace/out/${jobId}/`)
    }

    fs.writeFile(`/workspace/out/${jobId}/settings.txt`, job_details, () =>
      console.log(`settings written to /workspace/out/${jobId}/settings.txt`)
    )

    if (jobId && job_details)
      await database.run(
        `INSERT INTO jobs (job_id, created_at, job_details, show_gallery, show_queue, should_process)
        VALUES (:job_id, :created_at, :job_details, 1, 1, 1)`,
        {
          ":job_id": jobId,
          ":created_at": Date.now(),
          ":job_details": job_details,
        }
      )

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
