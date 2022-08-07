import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs/promises"
const path = require("path")
import { getAuth } from "@utils/getAuth"
import fetch from "node-fetch"
import { range } from "ramda"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

export const getImageDimensions = (height, width, maxHeight = 400) => {
  try {
    const aspectRatio = width / height

    const adjustedHeight = Math.min(maxHeight, height)
    const adjustedWidth = adjustedHeight * aspectRatio

    return {
      height: adjustedHeight,
      width: adjustedWidth,
    }
  } catch (e) {
    return { height: 300, width: 400 }
  }
}

export const getJobInfo = async (jobId, jobConfig) => {
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

    const latestImage = latestProgressFileName && `/api/image/${jobId}/${latestProgressFileName}`

    //     let latestImage
    //     let fileHandle

    //     try {
    //       var mime = "image/png"
    //       var encoding = "base64"
    //       fileHandle = await fs.open(`${directoryName}/${latestProgressFileName}`)
    //       const data = await fileHandle.readFile({ encoding })
    //       latestImage = "data:" + mime + ";" + encoding + "," + data
    //     } catch (e) {
    //     } finally {
    //       await fileHandle?.close()
    //     }

    return {
      finishedImages,
      latestImage,
      batchNumber,
      frame,
      config: parsedConfig,
      jobId,
      dimensions: { height, width },
    }
  } catch (e) {
    console.log(e)
    return []
  }
}

const handler = async (req, res) => {
  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const response = await (await fetch("http://localhost:9999/status")).json()

    const activeJobs = response?.activeProcesses
    const maxConcurrency = response?.maxConcurrency

    let progress = {}

    for (let gpuIndex of range(0, maxConcurrency)) {
      const matchedJob = activeJobs.find((job) => job.gpuIndex === gpuIndex)
      if (matchedJob) {
        progress[gpuIndex] = await getJobInfo(matchedJob.id, matchedJob.jobDetails)
      } else {
        progress[gpuIndex] = null
      }
    }

    res.status(200).json({
      success: true,
      progress,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
      progress: [],
    })
  }
}

export default handler
