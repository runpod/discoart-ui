import {
  Grid,
  Container,
  Typography,
  Stack,
  Button,
  Box,
  Dialog,
  DialogContent,
  TextField,
} from "@mui/material"
import { useCookies } from "react-cookie"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import ArtPodLogo from "./ArtPodLogo.png"
import { getAuth } from "@utils/getAuth"
import { LoadingButton } from "@mui/lab"
import LoginIcon from "@mui/icons-material/Login"

export async function getServerSideProps(context) {
  const auth = await getAuth(context)

  return {
    props: auth,
  }
}

export default function Welcome({ loggedIn, setPassword }) {
  const [cookies, setCookie] = useCookies(["password"])
  const [loading, setLoading] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const [repeatPasswordValue, setRepeatPasswordValue] = useState("")
  const router = useRouter()

  const handleSetPassword = async () => {
    setLoading(true)
    const payload = {
      password: passwordValue,
    }

    await fetch("/api/password", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(() => router.replace("/"))
  }

  const handleLogin = async () => {
    setLoading(true)
    setCookie("password", passwordValue)
    router.replace("/")
  }

  useEffect(() => {
    if (loggedIn) {
      router.replace("/create")
    }
  }, [loggedIn])

  return (
    <Dialog fullWidth maxWidth="md" open={true}>
      <DialogContent
        sx={{
          p: {
            xs: 1,
            sm: 2,
            md: 7,
          },
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Typography variant="h3">Welcome to ArtPod</Typography>
          <Box
            sx={{
              borderRadius: 10,
            }}
          >
            <Image
              style={{
                borderRadius: 10,
              }}
              height={300}
              width={300}
              src={ArtPodLogo}
            ></Image>
          </Box>
          {setPassword ? (
            <>
              <Stack spacing={0.5} alignItems="center">
                <Typography>Choose a password to continue</Typography>
              </Stack>
              <TextField
                type="password"
                value={repeatPasswordValue}
                onChange={(e) => setRepeatPasswordValue(e?.target?.value)}
              ></TextField>
              <TextField
                type="password"
                label="Repeat password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e?.target?.value)}
              ></TextField>
              <LoadingButton
                disabled={!passwordValue || passwordValue !== repeatPasswordValue}
                onClick={handleSetPassword}
                variant="contained"
                loading={loading}
                loadingPosition="start"
                loadingIndicator="Logging In..."
                startIcon={<LoginIcon />}
              >
                Set Password
              </LoadingButton>
            </>
          ) : (
            <>
              <Typography>Enter your password to log in</Typography>
              <TextField
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e?.target?.value)}
              ></TextField>
              <LoadingButton
                loading={loading}
                loadingPosition="start"
                disabled={!passwordValue}
                onClick={handleLogin}
                variant="contained"
                loadingIndicator="Logging In..."
                startIcon={<LoginIcon />}
              >
                Log In
              </LoadingButton>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
