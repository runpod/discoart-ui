import * as React from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import { Container, Stack } from "@mui/material"
import { useRouter } from "next/router"
import { SWRConfig } from "swr"
import axios from "axios"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { DarkTheme } from "../theme"

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
      <ThemeProvider theme={DarkTheme}>
        <CssBaseline />
        <Container
          maxWidth="xl"
          sx={{
            p: 0,
            m: "auto",
          }}
        >
          <AppBar position="static">
            <Toolbar>
              <Stack direction="row" spacing={2}>
                <Button disabled={route === "/"} href="/" color="inherit">
                  Create
                </Button>
                <Button disabled={route === "/gallery"} href="/gallery" color="inherit">
                  Gallery
                </Button>
              </Stack>
            </Toolbar>
          </AppBar>
          <Component {...pageProps} />
        </Container>
      </ThemeProvider>
    </SWRConfig>
  )
}

export default MyApp
