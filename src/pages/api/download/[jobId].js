import fs from "fs"
const Archiver = require("archiver")

export const config = {
  api: {
    responseLimit: false,
  },
}

const handler = async (req, res) => {
  const { jobId } = req.query

  try {
    const fileLocation = `/workspace/out/${jobId}/`
    // Tell the browser that this is a zip file.
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-disposition": `attachment; filename=${jobId}.zip`,
    })

    const files = fs
      .readdirSync(fileLocation)
      ?.filter((fileName) => fileName.includes("done") || fileName.includes("progress"))

    var zip = Archiver("zip")

    // Send the file to the page output.
    zip.pipe(res)

    for (let file of files) {
      zip.file(`${fileLocation}${file}`, { name: file })
    }

    zip.finalize()
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
