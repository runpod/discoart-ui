// import '../styles/globals.css'
import ThemeProvider from "./theme"
import * as React from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import { Container, Stack } from "@mui/material"
import { useRouter } from "next/router"

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  const route = router.pathname

  return (
    <ThemeProvider>
      <AppBar position="static">
        <Toolbar>
          <Container maxWidth="xl">
            <Stack direction="row" spacing={2}>
              <Button disabled={route === "/"} href="/" color="inherit">
                Create
              </Button>
              <Button disabled={route === "/queue"} href="/queue" color="inherit">
                Queue
              </Button>
              <Button disabled={route === "/gallery"} href="/gallery" color="inherit">
                Gallery
              </Button>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
