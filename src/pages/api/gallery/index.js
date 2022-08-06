import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs/promises"
const path = require("path")
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))
import { getImageDimensions } from "../progress"
import { getAuth } from "@utils/getAuth"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }
    const database = await db

    const directories = (await fs.readdir(`/workspace/out`))?.filter((name) => !name.includes("."))

    const galleries = (
      await Promise.all(
        directories.map(async (dir) => {
          try {
            const dirPath = `/workspace/out/${dir}/`

            const jobPromise = database.get(
              `
                  SELECT * from jobs
                    WHERE job_id = ?
                `,
              dir
            )

            let settings = null

            try {
              let rawSettings = await fs.readFile(`${dirPath}/settings.txt`)
              settings = JSON.parse(rawSettings)
            } catch (e) {
              console.log(e)
            }

            const allFiles = await fs.readdir(dirPath)

            const pictureFiles = allFiles.filter(
              (fileName) => !fileName.includes("settings") && !fileName.includes("progress")
            )

            const doneFiles = allFiles.filter((fileName) => fileName.includes("done"))

            const doneFileCount = doneFiles?.length

            if (!doneFileCount) return null

            const { height, width } = await sizeOf(`${dirPath}/${pictureFiles[0]}`)

            const dimensions = getImageDimensions(height, width)

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

            const sorted = (
              await Promise.all(
                pictureFiles
                  ?.filter((fileName) => fileName.includes("done"))
                  .map(async (v) => {
                    const filepath = path.resolve(dirPath, v)
                    const stat = await fs.stat(filepath)
                    return {
                      name: v,
                      time: stat?.mtime?.getTime(),
                    }
                  })
              )
            ).sort((a, b) => b.time - a.time)

            const latestTime = sorted?.[0]?.time

            const jobComplete = job?.completed_at
            const totalRendersExpected = jobComplete ? doneFileCount : job?.job_details?.n_batches

            return {
              url: `/api/image/${dir}/${sorted?.[0]?.name}`,
              dimensions,
              jobId: dir,
              fileCount: doneFileCount,
              totalRendersExpected,
              settings,
              jobComplete,
              job,
              latestUpdate: latestTime,
            }
          } catch (e) {
            console.log(e)
            return null
          }
        })
      )
    )
      .filter((gallery) => gallery)
      .sort((a, b) => b?.latestUpdate - a?.latestUpdate)

    res.status(200).json({ galleries })
  } catch (e) {
    res.status(200).json({ galleries: [] })
  }
}

export default handler
