import { useCallback, useEffect, useState } from "react"
// @mui
import { alpha, LinearProgress, useTheme, styled, linearProgressClasses } from "@mui/material"
import { Carousel } from "react-responsive-carousel"
import useMediaQuery from "@mui/material/useMediaQuery"

// CSS
import "react-responsive-carousel/lib/styles/carousel.min.css" // requires a loader

import Image from "next/image"
import ProgressCarouselItem from "./ProgressCarouselItem"
import useSWR from "swr"

const getThumbnailDimensions = ({ height, width, maxWidth = 80 }) => {
  try {
    const aspectRatio = height / width

    const adjustedWidth = Math.min(maxWidth, width)

    const adjustedHeight = adjustedWidth * aspectRatio

    return {
      height: adjustedHeight,
      width: adjustedWidth,
    }
  } catch (e) {
    return { height: 300, width: 400 }
  }
}

export default function ProgressCarousel({ handleImport, handleQueueRemove }) {
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"))

  const [carouselKey, setCarouselKey] = useState(1)

  useEffect(() => {
    const newWidth = window.innerWidth > 800 ? 800 : window.innerWidth
    setPreviewWidth(newWidth)
  }, [])

  const { data } = useSWR("/api/progress", null, {
    refreshInterval: 10000,
  })

  const [previewWidth, setPreviewWidth] = useState(smallScreen ? 350 : 500)

  useEffect(() => {
    setCarouselKey((prevKey) => prevKey + 1)
  }, [data?.progress?.length])

  return (
    <Carousel
      key={carouselKey}
      width={previewWidth}
      infiniteLoop
      showThumbs={!smallScreen}
      renderThumbs={() => {
        return data?.progress
          ?.filter(({ latestImage }) => latestImage)
          ?.map(({ latestImage, dimensions }) => (
            <Image
              alt="thumbnail image"
              key={latestImage}
              {...getThumbnailDimensions(dimensions)}
              src={latestImage}
            ></Image>
          ))
      }}
    >
      {data?.progress?.map(({ latestImage, dimensions, config, batchNumber, jobId }) => (
        <ProgressCarouselItem
          key={jobId}
          latestImage={latestImage}
          dimensions={dimensions}
          config={config}
          batchNumber={batchNumber}
          jobId={jobId}
          handleImport={handleImport}
          handleQueueRemove={handleQueueRemove}
        ></ProgressCarouselItem>
      ))}
    </Carousel>
  )
}
