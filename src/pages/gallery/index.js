import { Grid, Container, Typography, Stack, Button, Box } from "@mui/material"
import Image from "next/image"
import fs from "fs/promises"
import Link from "next/link"

export async function getServerSideProps() {
  try {
    const directories = (await fs.readdir(`/workspace/out`))?.filter((name) => !name.includes("."))

    const validDirectories = (
      await Promise.all(
        directories.map(async (dir) => {
          try {
            await fs.access(`/workspace/out/${dir}/0-done-0.png`)
            return dir
          } catch (e) {
            return null
          }
        })
      )
    ).filter((url) => url)

    return {
      props: {
        directories: validDirectories,
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

export default function Gallery({ directories }) {
  return (
    <Container maxWidth="xl" sx={{ p: 10 }}>
      <Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4">Successful Render Batches</Typography>
        </Stack>
        <Grid container spacing={2}>
          {directories?.map((dirName) => (
            <Grid item xs={12} md={6} lg={3} key={dirName}>
              <Link href={`/gallery/${dirName}`}>
                <Box
                  sx={{
                    cursor: "pointer",
                    "&:hover": { scale: 1.2 },
                    position: "relative",
                    objectFit: "contain",
                  }}
                  minHeight="300px"
                >
                  <Image
                    key={dirName}
                    src={`/api/image/${dirName}/0-done-0.png`}
                    layout="fill"
                  ></Image>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  )
}
