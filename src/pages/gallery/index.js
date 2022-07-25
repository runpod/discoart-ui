import { Grid, Container, Typography, Stack, Button, Box } from "@mui/material"
import Image from "next/image"
import fs from "fs/promises"
import Link from "next/link"
import { getImageDimensions } from "../api/progress"
import { Masonry } from "@mui/lab"
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))

export async function getServerSideProps() {
  try {
    const directories = (await fs.readdir(`/workspace/out`))?.filter((name) => !name.includes("."))

    const galleries = (
      await Promise.all(
        directories.map(async (dir) => {
          try {
            const filePath = `/workspace/out/${dir}/0-done-0.png`

            const { height, width } = await sizeOf(filePath)

            const dimensions = getImageDimensions(height, width)

            return {
              url: `/api/image/${dir}/0-done-0.png`,
              dimensions,
              jobId: dir,
            }
          } catch (e) {
            console.log(e)
            return null
          }
        })
      )
    ).filter((gallery) => gallery)

    return {
      props: {
        galleries,
      },
    }
  } catch (e) {
    console.log(e)
    return {
      props: {
        directories: [],
      },
    }
  }
}

export default function Gallery({ galleries }) {
  return (
    <Container maxWidth="xl" sx={{ p: 10 }}>
      <Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4">Render Batches</Typography>
        </Stack>
        <Masonry columns={{ sx: 1, md: 2, lg: 4 }} spacing={2}>
          {galleries?.map(({ url, dimensions, jobId }) => (
            <Link key={url} href={`/gallery/${jobId}`}>
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
              </Box>
            </Link>
          ))}
        </Masonry>
      </Stack>
    </Container>
  )
}
