const { createProxyMiddleware } = require("http-proxy-middleware")
import express from "express"

export const config = {
  api: { externalResolver: true },
}

const handler = express()

// Proxy endpoints
handler.use(
  "/api/control",
  createProxyMiddleware({
    target: "0.0.0.0:51001",
    changeOrigin: true,
    pathRewrite: {
      [`^/api/control`]: "",
    },
  })
)

export default handler
