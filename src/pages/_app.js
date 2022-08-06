import * as React from "react"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import { Breadcrumbs, Container, Stack, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useRouter } from "next/router"
import { SWRConfig } from "swr"
import axios from "axios"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { CookiesProvider } from "react-cookie"

import { DarkTheme } from "../theme"
import "../styles.css"
import Link from "next/link"

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const fetcher = (url) => axios.get(url).then((res) => res.data)

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"))

  const route = router.pathname

  const handleLogout = () => {
    fetch("/api/logout").then(() => router.replace("/"))
  }

  const pathArray =
    router?.asPath
      ?.split("/")
      ?.filter((path) => path)
      ?.map(capitalizeFirstLetter) || []

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
                {!smallScreen ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Breadcrumbs aria-label="breadcrumb">
                      <Link href="/create">
                        <a textDecoration="none">
                          <Typography
                            sx={{
                              cursor: "pointer",
                            }}
                            variant={"h4"}
                          >
                            ArtPod
                          </Typography>
                        </a>
                      </Link>
                      {route.includes("gallery") && (
                        <Link href="/gallery">
                          <a textDecoration="none">
                            <Typography
                              sx={{
                                cursor: "pointer",
                              }}
                              variant={"h4"}
                            >
                              Gallery
                            </Typography>
                          </a>
                        </Link>
                      )}
                      {route === "/gallery/[jobId]" && (
                        <Typography variant="h5">{router?.query?.jobId}</Typography>
                      )}
                    </Breadcrumbs>
                  </Stack>
                ) : null}
                <Stack direction="row" spacing={2} alignItems="center">
                  {route === "/create" || (
                    <Link href="/create">
                      <Typography
                        sx={{
                          cursor: "pointer",
                        }}
                        variant="h4"
                      >
                        Create
                      </Typography>
                    </Link>
                  )}

                  {route === "/gallery" || (
                    <Link href="/gallery">
                      <a>
                        <Typography
                          sx={{
                            cursor: "pointer",
                          }}
                          variant="h4"
                        >
                          Gallery
                        </Typography>
                      </a>
                    </Link>
                  )}
                  <Button ml={{ sx: 0, md: 3 }} onClick={handleLogout}>
                    Log Out
                  </Button>
                </Stack>
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
