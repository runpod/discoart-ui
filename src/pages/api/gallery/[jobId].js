// server
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import { databasePath } from "@utils/constants"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

import { getImageDimensions } from "../api/progress"
import { getAuth } from "@utils/getAuth"
import fs from "fs/promises"

const handler = async (req, res) => {
  try {
    const { jobId } = req?.query
    const auth = await getAuth(context)

    const directoryName = `/workspace/out/${jobId}`

    const database = await db

    const jobPromise = database.get(
      `
          SELECT * from jobs
            WHERE job_id = ?
        `,
      jobId
    )

    let job = null

    try {
      const rawJob = await jobPromise
      job = {
        ...rawJob,
        job_details: JSON.parse(rawJob?.job_details),
      }
    } catch (e) {
      console.log(e)
    }

    const files = (
      await Promise.all(
        fs.readdirSync(directoryName)?.map(async (fileName) => {
          try {
            const { height, width } = await sizeOf(`${directoryName}/${fileName}`)

            const dimensions = getImageDimensions(height, width)

            const url = `/api/image/${jobId}/${fileName}`

            const baseUrl = url.replace("gif", "png")

            return {
              url,
              baseUrl,
              fileName,
              dimensions,
            }
          } catch (e) {
            return null
          }
        })
      )
    )
      .filter((file) => file)
      .sort((a, b) => a.url - b.url)

    res.status(200).json({
      auth,
      files,
      job,
    })
  } catch (e) {
    console.log(e)
    return {
      props: {
        auth,
        files: [],
      },
    }
  }
}

export default handler
