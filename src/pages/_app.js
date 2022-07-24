import ThemeProvider from "../theme"
import * as React from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import { Container, Stack } from "@mui/material"
import { useRouter } from "next/router"
import { SWRConfig } from "swr"
import axios from "axios"

const fetcher = (url) => axios.get(url).then((res) => res.data)

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  const route = router.pathname

  return (
    <SWRConfig
      value={{
        fetcher,
      }}
    >
      <ThemeProvider>
        <AppBar position="static">
          <Toolbar>
            <Container maxWidth="xl">
              <Stack direction="row" spacing={2}>
                <Button disabled={route === "/"} href="/" color="inherit">
                  Create
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
    </SWRConfig>
  )
}

export default MyApp
