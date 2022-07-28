import { getAuth } from "@utils/getAuth"
import fs from "fs/promises"

export const config = {
  api: {
    responseLimit: false,
  },
}

const handler = async (req, res) => {
  try {
    const auth = await getAuth({ req, res })

    if (!auth?.loggedIn) {
      res.status(401)
    }
    const { jobId } = req.query

    const fileNames = req?.body?.fileNames || []

    for (let fileName of fileNames) {
      const filePath = `/workspace/out/${jobId}/${fileName}`

      try {
        await fs.unlink(filePath)
      } catch (e) {
        console.log(e)
      }
    }

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
