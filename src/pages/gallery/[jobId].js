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
  Switch,
  FormControlLabel,
} from "@mui/material"
import Image from "next/image"
import { useState, useMemo } from "react"
import SettingsViewer from "@components/SettingsViewer"
import { useRouter } from "next/router"
import { Masonry } from "@mui/lab"
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined"
import CircleIcon from "@mui/icons-material/Circle"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { omit } from "ramda"
import GifBoxIcon from "@mui/icons-material/GifBox"

// server
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))
import sqlite3 from "sqlite3"
import { open } from "sqlite"
import { databasePath } from "@utils/constants"
import fs from "fs/promises"

const db = open({
  filename: databasePath,
  driver: sqlite3.Database,
})

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

    const database = await db

    const jobPromise = database.get(
      `
      SELECT * from jobs
        WHERE job_id = ?
    `,
      jobId
    )

    let job = null

    try {
      const rawJob = await jobPromise
      job = {
        ...rawJob,
        job_details: JSON.parse(rawJob?.job_details),
      }
    } catch (e) {
      console.log(e)
    }

    const files = (
      await Promise.all(
        (
          await fs.readdir(directoryName)
        )?.map(async (fileName) => {
          try {
            const filePath = `${directoryName}/${fileName}`
            const { height, width } = await sizeOf(filePath)

            const dimensions = getImageDimensions(height, width)
            const stat = await fs.stat(filePath)

            const url = `/api/image/${jobId}/${fileName}`

            const baseUrl = url.replace("gif", "png")

            return {
              url,
              baseUrl,
              fileName,
              dimensions,
              time: stat?.mtime?.getTime(),
            }
          } catch (e) {
            console.log("error", e)
            return null
          }
        })
      )
    )
      .filter((file) => file)
      .sort((a, b) => b.time - a.time)

    return {
      props: {
        auth,
        files,
        job,
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

export default function JobGallery({ auth, files, job }) {
  useLoginRedirect(auth?.loggedIn)
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen, setDeleteClosed] = useOpenState(false)
  const router = useRouter()
  const { jobId } = router.query
  const [selected, setSelected] = useState({})
  const [jobName, setJobName] = useState(jobId)
  const [filterString, setFilterString] = useState("")
  const [doneOnly, setDoneOnly] = useState(true)

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

  const filteredFiles = useMemo(() => {
    return files?.filter((file) => {
      if (doneOnly) {
        return file?.fileName.includes(filterString) && file?.fileName.includes("done")
      } else {
        return file?.fileName.includes(filterString)
      }
    })
  }, [files, doneOnly, filterString])

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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={{ xs: "center", md: "start" }}
            spacing={1}
          >
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
                <Checkbox checked={doneOnly} onClick={() => setDoneOnly(!doneOnly)}></Checkbox>
              }
              label="Finals Only"
            />
            <TextField
              value={filterString}
              onChange={(e) => setFilterString(e?.target?.value)}
              label="File Name Filter"
              size="small"
            ></TextField>
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
                  {url.includes("gif") ? <GifBoxIcon /> : <VisibilityIcon />}
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
