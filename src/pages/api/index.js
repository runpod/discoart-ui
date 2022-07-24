import startDaemon from "@root/daemon"

startDaemon()

const handler = async (req, res) => {
  res.status(200)
}

export default handler
