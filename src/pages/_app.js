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
import { CookiesProvider } from "react-cookie"

import { DarkTheme } from "../theme"

const fetcher = (url) => axios.get(url).then((res) => res.data)

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  const route = router.pathname

  const handleLogout = () => {
    fetch("/api/logout").then(() => router.replace("/"))
  }

  return (
    <SWRConfig
      value={{
        fetcher,
      }}
    >
      <ThemeProvider theme={DarkTheme}>
        <CookiesProvider>
          <CssBaseline />
          <AppBar
            position="static"
            sx={{
              p: 1,
              wdith: "100%",
              margin: "auto",
            }}
          >
            <Toolbar>
              <Stack
                maxWidth="xl"
                sx={{
                  width: "100%",
                  px: 6,
                  margin: "auto",
                }}
                direction="row"
                spacing={2}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2}>
                  <Button
                    sx={{
                      pointerEvents: route === "/create" ? "none" : "auto",
                    }}
                    href="/create"
                    variant={route === "/create" ? "outlined" : "auto"}
                    size="small"
                  >
                    Create
                  </Button>
                  <Button
                    sx={{
                      pointerEvents: route === "/gallery" ? "none" : "auto",
                    }}
                    href="/gallery"
                    target="_blank"
                    variant={route === "/gallery" ? "outlined" : "auto"}
                    size="small"
                  >
                    Gallery
                  </Button>
                </Stack>

                <Button size="small" onClick={handleLogout}>
                  Log Out
                </Button>
              </Stack>
            </Toolbar>
          </AppBar>
          <Container
            maxWidth="xl"
            sx={{
              py: 0,
              m: "auto",
            }}
          >
            <Component {...pageProps} />
          </Container>
        </CookiesProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}

export default MyApp
