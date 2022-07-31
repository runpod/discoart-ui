import {
  Container,
  Button,
  Box,
  Typography,
  useTheme,
  alpha,
  TextField,
  IconButton,
  Checkbox,
  Stack,
  Grid,
  FormControlLabel,
} from "@mui/material"
import Image from "next/image"
import fs from "fs"
import { useState } from "react"
import SettingsViewer from "@components/SettingsViewer"
import { useRouter } from "next/router"
import { Masonry } from "@mui/lab"
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined"
import CircleIcon from "@mui/icons-material/Circle"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { omit } from "ramda"
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))

import useOpenState from "@hooks/useOpenState"
import { getImageDimensions } from "../api/progress"
import { getAuth } from "@utils/getAuth"
import { useLoginRedirect } from "@hooks/useLoginRedirect"
import GenericConfirmDialog from "@components/GenericConfirmDialog"

export async function getServerSideProps(context) {
  const jobId = context?.query?.jobId

  try {
    const auth = await getAuth(context)

    const directoryName = `/workspace/out/${jobId}`

    const files = (
      await Promise.all(
        fs.readdirSync(directoryName)?.map(async (fileName) => {
          try {
            const { height, width } = await sizeOf(`${directoryName}/${fileName}`)

            const dimensions = getImageDimensions(height, width)

            const url = `/api/image/${jobId}/${fileName}`

            return {
              url,
              baseUrl: url.replace("progress.gif", "done-0.png"),
              fileName,
              dimensions,
            }
          } catch (e) {
            return null
          }
        })
      )
    )
      .filter((file) => file)
      .sort((a, b) => a.url - b.url)

    return {
      props: {
        auth,
        files,
      },
    }
  } catch (e) {
    console.log(e)
    return {
      props: {
        auth,
        files: [],
      },
    }
  }
}

export default function JobGallery({ auth, files }) {
  useLoginRedirect(auth?.loggedIn)
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen, setDeleteClosed] = useOpenState(false)
  const router = useRouter()
  const { jobId } = router.query
  const [selected, setSelected] = useState({})
  const [jobName, setJobName] = useState(jobId)
  const [showPartials, setShowPartials] = useState(false)

  const handleToggleSelect = (fileName) => () => {
    const alreadySelected = selected[fileName]
    if (alreadySelected) {
      setSelected(omit([fileName], selected))
    } else {
      setSelected({ ...selected, [fileName]: true })
    }
  }

  const handleDelete = (fileNames) => async () => {
    await fetch(`/api/delete/${jobId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        fileNames: fileNames,
      }),
    }).then(() => {
      setSelected({})
      router.replace(router.asPath)
    })
  }

  const filteredFiles = files?.filter((file) => {
    if (showPartials) return true
    else return file?.fileName.includes("done") || file?.fileName.includes("gif")
  })

  const handleSelectAll = () => {
    let newSelected = {}
    filteredFiles.forEach((file) => {
      const fileName = file?.fileName

      newSelected[fileName] = true
    })

    setSelected({ ...selected, ...newSelected })
  }

  const handleDeselectAll = () => {
    setSelected({})
  }

  const allChecked = filteredFiles.every((file) => selected[file?.fileName])

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, sm: 3 } }}>
      <Grid container>
        <Grid item xs={12} sm={6} mb={{ xs: 1, md: 2 }}>
          <Stack direction="row" justifyContent={{ xs: "center", md: "start" }} spacing={1}>
            <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
              SETTINGS
            </Button>
            <FormControlLabel
              label="Select All"
              control={
                <Checkbox
                  checked={allChecked}
                  indeterminate={!allChecked && Object.values(selected).length > 0}
                  onClick={allChecked ? handleDeselectAll : handleSelectAll}
                />
              }
            />
            <FormControlLabel
              control={
                <Checkbox value={showPartials} onClick={() => setShowPartials(!showPartials)} />
              }
              label="Show Partials"
            ></FormControlLabel>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Stack
            direction="row"
            justifyContent={{ xs: "center", md: "end" }}
            spacing={1}
            sx={{ px: 2 }}
          >
            <TextField
              value={jobName}
              onChange={(e) => setJobName(e?.target?.value)}
              label="Download Name"
              size="small"
            ></TextField>
            <Button
              href={`/api/download/${jobId}?selectedFileNames=${Object.keys(
                selected
              )}&zipName=${jobName}`}
              variant="outlined"
              color="success"
              size="small"
            >
              DOWNLOAD
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={setDeleteOpen}>
              DELETE
            </Button>
          </Stack>
        </Grid>
      </Grid>
      <Masonry columns={{ sx: 1, md: 2, lg: 4 }} spacing={2}>
        {filteredFiles?.map(({ url, dimensions, fileName, baseUrl }) => (
          <Box
            key={url}
            sx={{
              position: "relative",
              transition: "transform .5s, box-shadow 1s",
              cursor: "pointer",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            onClick={handleToggleSelect(fileName)}
          >
            {fileName?.includes("gif") ? (
              <Image
                style={{
                  borderRadius: 10,
                }}
                alt=""
                src={baseUrl}
                {...dimensions}
              />
            ) : (
              <Image
                style={{
                  borderRadius: 10,
                }}
                alt=""
                src={url}
                {...dimensions}
              />
            )}
            <Box
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
              }}
            >
              {selected[fileName] ? (
                <CircleIcon color="success"></CircleIcon>
              ) : (
                <CircleOutlinedIcon></CircleOutlinedIcon>
              )}
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: 2,
                left: 2,
              }}
            >
              <a href={url} target="_blank" rel="noreferrer noopener">
                <IconButton color="info" component="label">
                  <VisibilityIcon />
                </IconButton>
              </a>
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
              <Typography variant="subtitle1">{fileName}</Typography>
            </Box>
          </Box>
        ))}
      </Masonry>

      <GenericConfirmDialog
        open={deleteOpen}
        title="Delete Files"
        text={
          <Stack direction="column" spacing={2}>
            <Typography>This will delete your selected files. This is NOT reversible!</Typography>
            <Stack spacing={0.25}>
              {Object.keys(selected).map((fileName) => (
                <Typography key={fileName}>{fileName}</Typography>
              ))}
            </Stack>
          </Stack>
        }
        onClose={setDeleteClosed}
        action={handleDelete(Object.keys(selected))}
        actionText="Delete"
      />
      <SettingsViewer jobId={jobId} open={open} onClose={() => setOpen(false)}></SettingsViewer>
    </Container>
  )
}
