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

  const gpuCount = Object.values(progress)?.length

  const handleNextGpu = () => {
    const newGpuIndex = parseInt(selectedGpuIndex) + 1
    if (newGpuIndex > gpuCount - 1) {
      setSelectedGpuIndex("0")
    } else {
      setSelectedGpuIndex(`${newGpuIndex}`)
    }
  }

  const handlePrevGpu = () => {
    const newGpuIndex = parseInt(selectedGpuIndex) - 1
    if (newGpuIndex < 0) {
      setSelectedGpuIndex(`${gpuCount - 1}`)
    } else {
      setSelectedGpuIndex(`${newGpuIndex}`)
    }
  }

  const handleSelectGpu = (event, newGpuIndex) => {
    if (newGpuIndex === null) return
    setSelectedGpuIndex(newGpuIndex)
  }

  return (
    <Stack spacing={1} alignItems={"center"}>
      <FormControlLabel
        control={<Switch checked={fullRes} onClick={() => setFullRes(!fullRes)}></Switch>}
        label="Display Full Resolution"
      />
      <Stack direction="row">
        <IconButton disabled={gpuCount <= 1} onClick={handlePrevGpu}>
          <NavigateBeforeIcon></NavigateBeforeIcon>
        </IconButton>
        <ToggleButtonGroup value={selectedGpuIndex} exclusive onChange={handleSelectGpu}>
          {Object.entries(progress)?.map(([gpuIndex, gpuJob]) => (
            <ToggleButton key={gpuIndex} sx={{ width: 80 }} value={gpuIndex}>
              <Stack alignItems="center">
                <MemoryIcon sx={{ mr: 0.5 }}></MemoryIcon>

                <Typography fontSize={11} variant="h4">
                  GPU: {gpuIndex}
                </Typography>
                <Typography fontSize={10} variant="subtitle1">
                  {gpuJob && gpuJob?.latestImage ? "render" : gpuJob ? "Init" : "idle"}
                </Typography>
              </Stack>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <IconButton disabled={gpuCount <= 1} onClick={handleNextGpu}>
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
