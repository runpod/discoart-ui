import readLastLines from "read-last-lines"

import { getAuth } from "@utils/getAuth"

const handler = async (req, res) => {
  const { jobId } = req.query

  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const logs = await readLastLines.read(`/workspace/logs/${jobId}.txt`, 100)

    res.status(200).json({
      success: true,
      logs,
    })
  } catch (e) {
    console.log(e)
    res.status(200).json({
      success: false,
    })
  }
}

export default handler
