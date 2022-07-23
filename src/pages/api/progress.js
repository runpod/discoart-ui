import sqlite3 from "sqlite3"
import { open } from "sqlite"
import { last } from "ramda"

const databasePath = "/workspace/database"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

const handler = async (req, res) => {
  console.log("PROGRESS CALLED")

  const database = await db

  try {
    const runningJob = await database.get(
      `SELECT job_id from jobs WHERE started_at is not null AND completed_at is null ORDER BY created_at ASC`
    )

    if (!runningJob) {
      return {
        success: true,
        progress: null,
      }
    }

    const runningJobStatus = await fetch("http:localhost:51001/post", {
      method: "POST",
      body: JSON.stringify({
        execEndpoint: "/result",
        parameters: { name_docarray: runningJob.job_id },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    const json = await runningJobStatus.json()

    const data = json?.data || []

    const currentImage = last(data)

    const uri = currentImage?.uri
    const tags = currentImage?.tags

    const batchTotalCount = tags?.n_batches
    const currentIndex = data.length + 1

    res.status(200).json({
      success: true,
      progress: {
        uri,
        tags,
        completed: currentImage?.tags?._status?.completed,
        stepsTotal: currentImage?.tags?.steps,
        stepsComplete: currentImage?.tags?._status?.step + 1,
        currentBatchIndex: currentIndex,
        batchTotalCount: batchTotalCount,
      },
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
