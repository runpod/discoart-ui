const express = require("express")
const morgan = require("morgan")
const path = require("path")
const { createProxyMiddleware } = require("http-proxy-middleware")

// Create Express Server
const app = express()

// Configuration
const PORT = 8888
const HOST = "0.0.0.0"
const API_SERVICE_URL = "0.0.0.0:51001"

// Logging
app.use(morgan("dev"))

app.use(express.static(path.join(__dirname, "build")))

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"))
})

const dir = path.join(__dirname, "out")

app.use("images", express.static(dir))

// Authorization
app.use("/discoart", (req, res, next) => {
  if (req.headers.authorization) {
    next()
  } else {
    res.sendStatus(403)
  }
})

// Proxy endpoints
app.use(
  "/discoart",
  createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      [`^/discoart`]: "",
    },
  })
)

// Start Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`)
})
