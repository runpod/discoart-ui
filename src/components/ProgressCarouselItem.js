import { useEffect, useState } from "react"
// @mui
import {
  alpha,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
  styled,
  linearProgressClasses,
  CircularProgress,
} from "@mui/material"
import useMediaQuery from "@mui/material/useMediaQuery"

// CSS
import ArtPodLogo from "../pages/ArtPodLogo.png"
import "react-responsive-carousel/lib/styles/carousel.min.css" // requires a loader

import LogViewer from "@components/LogViewer"
import SettingsViewer from "@components/SettingsViewer"

import Image from "next/image"
import useSWR from "swr"

const getSubstring = (string, startString, endString) =>
  string.slice(string.lastIndexOf(startString) + 1, string.lastIndexOf(endString)).trim()

const getThumbnailDimensions = ({ height, width, maxWidth = 80, fullRes }) => {
  try {
    if (fullRes) {
      return {
        height,
        width,
      }
    }

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

const GradientLinearProgress = styled(LinearProgress)(
  ({ theme }) => `
          height: 10px;
          border-radius: ${theme.general.borderRadiusSm};
  
          &.${linearProgressClasses.colorPrimary} {
              background-color: ${alpha(theme.colors.primary.main, 0.1)};
              box-shadow: inset 0 1px 2px ${alpha(theme.colors.primary.dark, 0.2)};
          }
          
          & .${linearProgressClasses.bar} {
              border-radius: ${theme.general.borderRadiusSm};
              background: ${theme.colors.gradients.purple1};
          }
      `
)

export default function ProgressCarouselItem({
  latestImage,
  dimensions,
  config,
  batchNumber,
  jobId,
  handleImport,
  handleQueueRemove,
  fullRes,
  previewWidth,
}) {
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"))

  const [progressMetrics, setProgressMetrics] = useState(null)

  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [settingsViewerOpen, setSettingsViewerOpen] = useState(false)

  const { data: logProgress } = useSWR(`/api/logs/${jobId}?lines=1`, null, {
    refreshInterval: 2000,
  })

  useEffect(() => {
    try {
      if (!logProgress?.logs?.includes("s/it]")) {
        setProgressMetrics(null)
      } else {
        const timeElapsed = getSubstring(logProgress?.logs, "[", "<")
        const timeRemaining = getSubstring(logProgress?.logs, "<", ",")
        const iterationSpeed = getSubstring(logProgress?.logs, ",", "/it")
        const frameProgress = getSubstring(logProgress?.logs, "|", "[")
        const [rawCurrentFrame, rawTotalFrames] = frameProgress.split("/")

        const currentFrame = parseInt(rawCurrentFrame)
        const totalFrames = parseInt(rawTotalFrames)

        if (isNaN(currentFrame) || isNaN(totalFrames)) {
          setProgressMetrics(null)
        } else {
          setProgressMetrics({
            timeElapsed,
            timeRemaining,
            iterationSpeed,
            currentFrame,
            totalFrames,
          })
        }
      }
    } catch (e) {
      // console.log(e)
      setProgressMetrics(null)
    }
  }, [logProgress])

  return (
    <>
      <Stack
        alignItems="center"
        spacing={1}
        data_job_id={jobId}
        key={latestImage}
        minHeight="600px"
      >
        <Typography>{config?.batch_name}</Typography>
        {latestImage ? (
          <>
            <Box
              sx={{
                position: "relative",
              }}
            >
              <GradientLinearProgress
                sx={{
                  borderRadius: 5,
                  width: Math.min(previewWidth * 0.8, 600),
                  height: 20,
                }}
                variant="determinate"
                value={
                  ((progressMetrics?.currentFrame || 0) / (progressMetrics?.totalFrames || 100)) *
                  100
                }
              />
              <Typography
                sx={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  right: 0,
                }}
                align="center"
                fontSize={10}
                variant="subtitle1"
              >{`${
                progressMetrics
                  ? `Frame: ${progressMetrics.currentFrame}/${progressMetrics?.totalFrames}   ${progressMetrics.timeElapsed}<${progressMetrics.timeRemaining}, ${progressMetrics.iterationSpeed}/it`
                  : ""
              }`}</Typography>
            </Box>
            <Box
              sx={{
                position: "relative",
              }}
            >
              <GradientLinearProgress
                sx={{
                  borderRadius: 5,
                  width: Math.min(previewWidth * 0.8, 600),
                  height: 20,
                }}
                variant="determinate"
                value={(batchNumber / config?.n_batches) * 100}
              ></GradientLinearProgress>
              <Typography
                sx={{
                  position: "absolute",
                  top: 2,
                  left: 0,
                  right: 0,
                }}
                align="center"
                fontSize={10}
                variant="subtitle1"
              >{`${batchNumber}/${config?.n_batches}`}</Typography>
            </Box>
          </>
        ) : (
          <Typography variant="h5">{logProgress?.logs || " "}</Typography>
        )}

        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={handleQueueRemove(jobId)} variant="outlined">
            Cancel
          </Button>
          <Button variant="outlined" size="small" onClick={() => setSettingsViewerOpen(true)}>
            SETTINGS
          </Button>
          <Button variant="outlined" size="small" onClick={() => setLogViewerOpen(true)}>
            LOGS
          </Button>
        </Stack>
        <Box
          sx={{
            display: "flex",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {latestImage ? (
            <Image
              alt=""
              {...getThumbnailDimensions({
                ...dimensions,
                maxWidth: previewWidth,
                fullRes,
              })}
              src={latestImage}
            />
          ) : (
            <Box
              sx={{
                position: "relative",
              }}
            >
              <Image alt="" height={256} width={256} src={ArtPodLogo} />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress color="info" size={100}></CircularProgress>
              </Box>
            </Box>
          )}
        </Box>
      </Stack>
      <LogViewer open={logViewerOpen} onClose={() => setLogViewerOpen(false)} jobId={jobId} />
      <SettingsViewer
        open={settingsViewerOpen}
        onClose={() => setSettingsViewerOpen(false)}
        jobId={jobId}
        handleImport={handleImport}
      />
    </>
  )
}
