const path = require("path")
const fs = require("fs")
//joining path of directory
const directoryPath = path.join("./out")
//passsing directoryPath and callback function

export default async function handler(req, res) {
  const files = await fs.readdirSync(directoryPath)

  res.status(200).json({ files })
}
