import { Grid, Container, Button, Box } from "@mui/material"
import Image from "next/image"
import fs from "fs"

export async function getServerSideProps(context) {
  const jobId = context?.query?.jobId

  try {
    const files = fs
      .readdirSync(`./discoDaemon/${jobId}`)
      ?.filter((fileName) => fileName.includes("done"))
      ?.map((fileName) => `/api/image/${jobId}/${fileName}`)
    return {
      props: {
        imageUrls: files,
      },
    }
  } catch (e) {
    return {
      props: {
        imageUrls: [],
      },
    }
  }
}

export default function JobGallery({ imageUrls }) {
  return (
    <Container maxWidth="xl" sx={{ p: 10 }}>
      <Button href="/gallery">Back to Gallery</Button>
      <Grid container spacing={2}>
        {imageUrls?.map((imageUrl) => (
          <Grid item xs={12} md={6} lg={3} key={imageUrl}>
            <a href={imageUrl} target="_blank" rel="noreferrer noopener">
              <Box
                sx={{
                  cursor: "pointer",
                  "&:hover": { scale: 1.2 },
                  position: "relative",
                  objectFit: "contain",
                }}
                minHeight="300px"
              >
                <Image key={imageUrl} src={imageUrl} layout="fill"></Image>
              </Box>
            </a>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
