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
import { CookiesProvider, useCookies } from "react-cookie"

import { DarkTheme } from "../theme"

const fetcher = (url) => axios.get(url).then((res) => res.data)

function MyApp({ Component, pageProps }) {
  const [cookies, setCookie, removeCookie] = useCookies(["password"])
  const router = useRouter()

  const route = router.pathname

  const handleLogout = () => {
    removeCookie("password")
    router.replace("/")
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
          <Container
            maxWidth="xl"
            sx={{
              p: 0,
              m: "auto",
            }}
          >
            <AppBar
              position="static"
              sx={{
                borderRadius: 2,
                p: 1,
              }}
            >
              <Toolbar>
                <Stack
                  sx={{
                    width: "100%",
                    px: 3,
                  }}
                  direction="row"
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={2}>
                    <Button disabled={route === "/create"} href="/create" color="inherit">
                      Create
                    </Button>
                    <Button
                      disabled={route === "/gallery"}
                      href="/gallery"
                      target="_blank"
                      color="inherit"
                    >
                      Gallery
                    </Button>
                  </Stack>

                  <Button onClick={handleLogout}>Log Out</Button>
                </Stack>
              </Toolbar>
            </AppBar>
            <Component {...pageProps} />
          </Container>
        </CookiesProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}

export default MyApp
