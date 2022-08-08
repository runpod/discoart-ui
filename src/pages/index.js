import { Typography, Stack, Box, Dialog, DialogContent, TextField } from "@mui/material"
import { useCookies } from "react-cookie"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import ArtPodLogo from "./ArtPodLogo.png"
import { getAuth } from "@utils/getAuth"
import { LoadingButton } from "@mui/lab"
import LoginIcon from "@mui/icons-material/Login"
import { useForm } from "react-hook-form"
import { ControlledTextField } from "@components/DiscoInput"

export async function getServerSideProps(context) {
  const auth = await getAuth(context)

  return {
    props: auth,
  }
}

export default function Welcome({ loggedIn, setPassword }) {
  const [cookies, setCookie] = useCookies(["password"])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [error, setError] = useState("")

  const { control, handleSubmit, watch } = useForm()

  const handleSetPassword = async (password) => {
    setLoading(true)
    setError("")
    const payload = {
      password: password,
    }

    await fetch("/api/password", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(() => {
        setCookie("password", password)
        router.replace("/")
      })
      .catch((e) => {
        setLoading(false)
        setError("Issue setting password")
      })
  }

  const handleLogin = async (password) => {
    setLoading(true)
    setError("")
    setCookie("password", password)

    await fetch("/api/login", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then((data) => {
        return data.json()
      })
      .then(({ loggedIn }) => {
        if (loggedIn) {
          router.replace("/")
        } else {
          setError("Incorrect Password")
          setLoading(false)
        }
      })
      .catch((e) => {
        setError("Incorrect Password")
        setLoading(false)
      })
  }

  const onSubmit = (data) => {
    if (setPassword) {
      handleSetPassword(data?.setPassword)
    } else {
      handleLogin(data?.password)
    }
  }

  useEffect(() => {
    if (loggedIn) {
      router.replace("/create")
    }
  }, [loggedIn])

  const passwordValue = watch("setPassword")
  const repeatPasswordValue = watch("repeatPassword")
  const loginPassword = watch("password")

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h3">Welcome to ArtPod</Typography>
            <Typography variant="subtitle1">
              Powered by{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/jina-ai/discoart"
              >
                discoart
              </a>
            </Typography>
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
            <Typography variant="subtitle1" color="red">
              {error}
            </Typography>
            {setPassword ? (
              <>
                <Stack spacing={0.5} alignItems="center">
                  <Typography>Choose a password to continue</Typography>
                </Stack>
                <Stack spacing={1} sx={{ width: 300 }}>
                  <ControlledTextField
                    control={control}
                    type="password"
                    label="Password"
                    name="setPassword"
                  ></ControlledTextField>
                  <ControlledTextField
                    control={control}
                    type="password"
                    label="Repeat Password"
                    name="repeatPassword"
                  ></ControlledTextField>
                  <LoadingButton
                    disabled={!passwordValue || passwordValue !== repeatPasswordValue}
                    variant="contained"
                    loading={loading}
                    loadingPosition="start"
                    startIcon={<LoginIcon />}
                    type="submit"
                  >
                    Set Password
                  </LoadingButton>
                </Stack>
              </>
            ) : (
              <>
                <Typography>Enter your password to log in</Typography>
                <Stack spacing={1} sx={{ width: 300 }}>
                  <ControlledTextField
                    control={control}
                    label="Password"
                    type="password"
                    name="password"
                  ></ControlledTextField>
                  <LoadingButton
                    loading={loading}
                    loadingPosition="start"
                    disabled={!loginPassword}
                    variant="contained"
                    startIcon={<LoginIcon />}
                    type="submit"
                  >
                    Log In
                  </LoadingButton>
                </Stack>
              </>
            )}
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  )
}
