import {
  Button,
  Container,
  Typography,
  Stack,
  alpha,
  Box,
  LinearProgress,
  Badge,
  TextField,
  useTheme,
} from "@mui/material"
import Image from "next/image"
import Link from "next/link"
import { Masonry } from "@mui/lab"
import { getAuth } from "@utils/getAuth"
import { useLoginRedirect } from "@hooks/useLoginRedirect"
import PermMediaIcon from "@mui/icons-material/PermMedia"
import { useState } from "react"

import useSWR from "swr"

export async function getServerSideProps(context) {
  try {
    const auth = await getAuth(context)

    return {
      props: {
        auth,
      },
    }
  } catch (e) {
    return {
      props: {
        auth: {
          loggedIn: false,
        },
      },
    }
  }
}

export default function Gallery({ auth }) {
  const theme = useTheme()
  const [filterString, setFilterString] = useState("")

  const { data } = useSWR("/api/gallery", null, {
    refreshInterval: 10000,
  })

  const galleries = data?.galleries

  const filteredGalleries = galleries?.filter((gallery) => {
    return gallery?.settings?.batch_name?.includes(filterString)
  })

  useLoginRedirect(auth?.loggedIn)

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, sm: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between">
          <TextField
            sx={{ width: 200, ml: 1 }}
            value={filterString}
            onChange={(e) => setFilterString(e?.target?.value)}
            label="Batch Name Filter"
            size="small"
          ></TextField>
          <Button variant="outlined" href={`/api/download?all=true`}>
            Download Finals
          </Button>
        </Stack>
        <Masonry columns={{ sx: 1, md: 2, lg: 4 }} spacing={2}>
          {filteredGalleries?.map(
            ({ url, dimensions, jobId, fileCount, job, jobComplete, settings }) => (
              <Link key={url} href={`/gallery/${jobId}`}>
                <a>
                  <Badge badgeContent={fileCount} color="primary">
                    <Box
                      sx={{
                        transition: "transform .5s, box-shadow 1s",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <Image
                        key={jobId}
                        src={url}
                        alt=""
                        {...dimensions}
                        style={{
                          borderRadius: 10,
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                        }}
                      >
                        <PermMediaIcon color="info"></PermMediaIcon>
                      </Box>
                      <Box
                        sx={{
                          borderRadius: "0px 0px 10px 10px",
                          background: alpha(theme.palette.background.paper, 0.6),
                          position: "absolute",
                          py: 0.5,
                          px: 1,
                          bottom: 0,
                          left: 0,
                          right: 0,
                        }}
                      >
                        <Typography variant="subtitle1">{settings?.batch_name}</Typography>
                        {!jobComplete && job?.should_process && (
                          <Box sx={{ position: "relative" }}>
                            <LinearProgress
                              sx={{ height: 15 }}
                              variant="determinate"
                              value={(fileCount / settings?.n_batches) * 100}
                            ></LinearProgress>
                            <Box sx={{ position: "absolute", bottom: 0, left: 4, right: 0 }}>
                              <Typography
                                fontSize={10}
                                align="center"
                              >{`${fileCount}/${settings?.n_batches}`}</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Badge>
                </a>
              </Link>
            )
          )}
        </Masonry>
      </Stack>
    </Container>
  )
}
