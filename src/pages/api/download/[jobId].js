import { getAuth } from "@utils/getAuth"
import fs from "fs"
const Archiver = require("archiver")

export const config = {
  api: {
    responseLimit: false,
  },
}

const handler = async (req, res) => {
  const { jobId, selectedFileNames, zipName } = req.query

  try {
    const auth = await getAuth({ req, res })
    if (!auth?.loggedIn) {
      res.status(401)
    }

    const fileNames = selectedFileNames.split(",") || []

    const fileLocation = `/workspace/out/${jobId}/`

    if (fileNames.length === 1) {
      const fileName = fileNames[0]
      const fileStream = fs.createReadStream(`${fileLocation}${fileNames[0]}`)

      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-disposition": `attachment; filename=${fileName}`,
      })

      fileStream.pipe(res)
    } else {
      // Tell the browser that this is a zip file.
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-disposition": `attachment; filename=${zipName || jobId}.zip`,
      })

      var zip = Archiver("zip")

      // Send the file to the page output.
      zip.pipe(res)

      for (let fileName of fileNames) {
        zip.file(`${fileLocation}${fileName}`, { name: fileName })
      }

      zip.file(`${fileLocation}settings.txt`, { name: "settings.txt" })

      zip.finalize()
    }
  } catch (e) {
    console.log(e)
    res.status(404)
  }
}

export default handler
