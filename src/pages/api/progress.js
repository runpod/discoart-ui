import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs/promises"
const path = require("path")

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

export const getImageDimensions = (height, width) => {
  try {
    const aspectRatio = width / height

    const adjustedHeight = Math.min(400, height)
    const adjustedWidth = adjustedHeight * aspectRatio

    return {
      height: adjustedHeight,
      width: adjustedWidth,
    }
  } catch (e) {
    return { height: 300, width: 400 }
  }
}

const getJobInfo = async (jobId, jobConfig) => {
  try {
    const directoryName = `/workspace/out/${jobId}`
    const files = await fs.readdir(directoryName)

    const parsedConfig = JSON.parse(jobConfig)

    const finishedImages = files
      ?.filter((fileName) => fileName.includes("done"))
      ?.map((fileName) => `/api/image/${jobId}/${fileName}`)

    const sorted = (
      await Promise.all(
        files
          ?.filter((fileName) => fileName.includes("step"))
          .map(async (v) => {
            const filepath = path.resolve(directoryName, v)
            const stat = await fs.stat(filepath)
            return {
              name: v,
              time: stat?.mtime?.getTime(),
            }
          })
      )
    )
      .sort((a, b) => b.time - a.time)
      .map((v) => v.name)

    const latestProgressFileName = sorted?.[0]

    const [batchNumber, _, frame] = latestProgressFileName?.split("-") || []

    const height = parsedConfig?.width_height?.[1]
    const width = parsedConfig?.width_height?.[0]

    return {
      finishedImages,
      latestImage: latestProgressFileName && `/api/image/${jobId}/${latestProgressFileName}`,
      batchNumber,
      frame,
      config: parsedConfig,
      dimensions: getImageDimensions(height, width),
    }
  } catch (e) {
    console.log(e)
    return null
  }
}

const handler = async (req, res) => {
  const database = await db

  try {
    const runningJob = await database.get(
      `SELECT job_id, job_details from jobs WHERE started_at is not null AND completed_at is null ORDER BY created_at ASC`
    )

    if (!runningJob) {
      res.status(200).json({
        success: true,
        progress: null,
      })
      return
    }

    const progress = await getJobInfo(runningJob.job_id, runningJob.job_details)

    res.status(200).json({
      success: true,
      progress,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
