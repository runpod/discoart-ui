import fs from "fs"

const handler = async (req, res) => {
  const { jobId } = req.query

  try {
    const stream = fs.createReadStream(`/workspace/out/${jobId}/settings.txt`)

    stream.pipe(res)
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
