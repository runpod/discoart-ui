import fs from "fs"

import { getAuth } from "@utils/getAuth"

const handler = async (req, res) => {
  const { jobId } = req.query

  try {
    const auth = getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const stream = fs.createReadStream(`/workspace/out/${jobId}/settings.txt`)

    stream.pipe(res)
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
