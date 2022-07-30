import { Grid, Container, Typography, Stack, Button, Box, Badge } from "@mui/material"
import Image from "next/image"
import fs from "fs/promises"
import Link from "next/link"
import { getImageDimensions } from "../api/progress"
import { Masonry } from "@mui/lab"
import { getAuth } from "@utils/getAuth"
import { useLoginRedirect } from "@hooks/useLoginRedirect"
const { promisify } = require("util")
const sizeOf = promisify(require("image-size"))

export async function getServerSideProps(context) {
  try {
    const auth = await getAuth(context)

    const directories = (await fs.readdir(`/workspace/out`))?.filter((name) => !name.includes("."))

    const galleries = (
      await Promise.all(
        directories.map(async (dir) => {
          try {
            const dirPath = `/workspace/out/${dir}/`
            const filePath = `${dirPath}0-done-0.png`

            const files = (await fs.readdir(dirPath)).filter((fileName) =>
              fileName.includes("done")
            )
            const fileCount = files?.length

            const { height, width } = await sizeOf(filePath)

            const dimensions = getImageDimensions(height, width)

            return {
              url: `/api/image/${dir}/0-done-0.png`,
              dimensions,
              jobId: dir,
              fileCount,
            }
          } catch (e) {
            console.log(e)
            return null
          }
        })
      )
    )
      .filter((gallery) => gallery)
      .sort((a, b) => a.jobId - b.jobId)

    return {
      props: {
        galleries,
        auth,
      },
    }
  } catch (e) {
    return {
      props: { galleries: [] },
    }
  }
}

export default function Gallery({ auth, galleries }) {
  useLoginRedirect(auth?.loggedIn)
  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, md: 10 } }}>
      <Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4">Render Batches</Typography>
        </Stack>
        <Masonry columns={{ sx: 1, md: 2, lg: 4 }} spacing={2}>
          {galleries?.map(({ url, dimensions, jobId, fileCount }) => (
            <Link key={url} href={`/gallery/${jobId}`}>
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
                </Box>
              </Badge>
            </Link>
          ))}
        </Masonry>
      </Stack>
    </Container>
  )
}
