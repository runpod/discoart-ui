import { useEffect, useState } from "react"
// @mui
import {
  Box,
  useTheme,
  Switch,
  Stack,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  IconButton,
} from "@mui/material"
import MemoryIcon from "@mui/icons-material/Memory"
import useMediaQuery from "@mui/material/useMediaQuery"
import NavigateNextIcon from "@mui/icons-material/NavigateNext"
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore"

import ProgressCarouselItem from "./ProgressCarouselItem"

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

export default function ProgressCarousel({ progress = {}, handleImport, handleQueueRemove }) {
  const theme = useTheme()
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"))
  const [fullRes, setFullRes] = useState(false)

  useEffect(() => {
    const newWidth = window.innerWidth > 800 ? 800 : window.innerWidth
    setPreviewWidth(newWidth)
  }, [])

  const [previewWidth, setPreviewWidth] = useState(smallScreen ? 350 : 500)

  const [selectedGpuIndex, setSelectedGpuIndex] = useState(0)

  const handleNextGpu = () => {
    const activeGpuCount = Object.values(progress)?.length
    const newGpuIndex = parseInt(selectedGpuIndex) + 1
    if (newGpuIndex > activeGpuCount - 1) {
      setSelectedGpuIndex("0")
    } else {
      setSelectedGpuIndex(`${newGpuIndex}`)
    }
  }

  const handlePrevGpu = () => {
    const activeGpuCount = Object.values(progress)?.length

    const newGpuIndex = parseInt(selectedGpuIndex) - 1
    if (newGpuIndex < 0) {
      setSelectedGpuIndex(`${activeGpuCount - 1}`)
    } else {
      setSelectedGpuIndex(`${newGpuIndex}`)
    }
  }

  const handleSelectGpu = (event, newGpuIndex) => {
    setSelectedGpuIndex(newGpuIndex)
  }

  console.log(typeof selectedGpuIndex, selectedGpuIndex)

  return (
    <Stack spacing={1} alignItems={"center"}>
      <FormControlLabel
        control={<Switch checked={fullRes} onClick={() => setFullRes(!fullRes)}></Switch>}
        label="Display Full Resolution"
      />
      <Stack direction="row">
        <IconButton onClick={handlePrevGpu}>
          <NavigateBeforeIcon></NavigateBeforeIcon>
        </IconButton>
        <ToggleButtonGroup value={selectedGpuIndex} exclusive onChange={handleSelectGpu}>
          {Object.entries(progress)?.map(([gpuIndex, gpuJob]) => (
            <ToggleButton key={gpuIndex} sx={{ width: 80 }} value={gpuIndex}>
              <Stack alignItems="center">
                <Stack direction="row" spacing={2}>
                  <MemoryIcon sx={{ mr: 0.5 }}></MemoryIcon>
                  {gpuIndex}
                </Stack>
                <Typography fontSize={10} variant="subtitle1">
                  {gpuJob && gpuJob?.latestImage ? "render" : gpuJob ? "Init" : "idle"}
                </Typography>
              </Stack>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <IconButton onClick={handleNextGpu}>
          <NavigateNextIcon></NavigateNextIcon>
        </IconButton>
      </Stack>

      {progress?.[selectedGpuIndex] ? (
        <ProgressCarouselItem
          fullRes={fullRes}
          previewWidth={previewWidth}
          {...progress?.[selectedGpuIndex]}
          handleImport={handleImport}
          handleQueueRemove={handleQueueRemove}
        ></ProgressCarouselItem>
      ) : (
        <Box
          sx={{
            height: 600,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h2">GPU Idle</Typography>
        </Box>
      )}
    </Stack>
  )
}
