const handler = async (req, res) => {
  const result = await fetch("http:localhost:51001/post", {
    method: "POST",
    body: JSON.stringify(req.body),
    headers: {
      "Content-Type": "application/json",
    },
  })

  res.status(200).json(result)
}

export default handler
