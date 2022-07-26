import { Container, Button, Box } from "@mui/material"
import Image from "next/image"
import fs from "fs"
import { useState } from "react"
import SettingsViewer from "@components/SettingsViewer"
import { useRouter } from "next/router"
import { Masonry } from "@mui/lab"
import { getImageDimensions } from "../api/progress"
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))

export async function getServerSideProps(context) {
  const jobId = context?.query?.jobId

  try {
    const directoryName = `/workspace/out/${jobId}`

    const files = (
      await Promise.all(
        fs
          .readdirSync(directoryName)
          ?.filter((fileName) => fileName.includes("done"))
          ?.map(async (fileName) => {
            try {
              const { height, width } = await sizeOf(`${directoryName}/${fileName}`)

              const dimensions = getImageDimensions(height, width)

              return {
                url: `/api/image/${jobId}/${fileName}`,
                dimensions,
              }
            } catch (e) {
              console.log(e)
              return null
            }
          })
      )
    ).filter((file) => file)

    return {
      props: {
        files,
      },
    }
  } catch (e) {
    console.log(e)
    return {
      props: {
        files: [],
      },
    }
  }
}

export default function JobGallery({ files }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { jobId } = router.query

  return (
    <Container maxWidth="xl" sx={{ p: 10 }}>
      <Button onClick={() => setOpen(true)}>SETTINGS</Button>
      <Button href={`/api/download/${jobId}?includeProgress=true`}>DOWNLOAD ALL</Button>
      <Button href={`/api/download/${jobId}`}>DOWNLOAD IMAGES</Button>
      <Masonry columns={{ sx: 1, md: 2, lg: 4 }} spacing={2}>
        {files?.map(({ url, dimensions }) => (
          <a key={url} href={url} target="_blank" rel="noreferrer noopener">
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
                style={{
                  borderRadius: 10,
                }}
                alt=""
                src={url}
                {...dimensions}
              />
            </Box>
          </a>
        ))}
      </Masonry>
      <SettingsViewer jobId={jobId} open={open} onClose={() => setOpen(false)}></SettingsViewer>
    </Container>
  )
}
