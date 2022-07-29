import readLastLines from "read-last-lines"

import { getAuth } from "@utils/getAuth"

const handler = async (req, res) => {
  const { jobId, lines = 100 } = req.query

  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const linesToReturn = parseInt(lines)

    const logs = await readLastLines.read(`/workspace/logs/${jobId}.txt`, linesToReturn)

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
