const path = require("path")
const fs = require("fs")
import { getAuth } from "@utils/getAuth"
//joining path of directory
const directoryPath = path.join("../")
//passsing directoryPath and callback function

export default async function handler(req, res) {
  const auth = getAuth({ req, res })
  if (!auth?.loggedIn) {
    res.status(401)
  }

  const files = await fs.readdirSync(directoryPath)

  res.status(200).json({ files })
}
