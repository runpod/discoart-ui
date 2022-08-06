import { Box, Button, TableCell, Stack, Typography, useTheme } from "@mui/material"
import { useState } from "react"
import { format } from "date-fns"
import LogViewer from "./LogViewer"
import SettingsViewer from "./SettingsViewer"
import Image from "next/image"

export default function ErrorEntry({ job, handleQueueRemove, handleImport, index }) {
  const theme = useTheme()
  const { job_id } = job

  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [settingsViewerOpen, setSettingsViewerOpen] = useState(false)

  const jobDetails = JSON.parse(job?.job_details)

  return (
    <Stack
      key={job.job_id}
      sx={{
        padding: 2,
        outline: `1px solid ${theme.colors.info.main}`,
        borderRadius: 1,
      }}
      spacing={2}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Stack>
        <Typography variant="h4">{jobDetails?.batch_name}</Typography>
        <Typography variant="subtitle1">
          {`${jobDetails?.text_prompts?.prompts?.[0]?.text?.substring(0, 50)}...`}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" onClick={() => setSettingsViewerOpen(true)}>
          SETTINGS
        </Button>
        <Button variant="outlined" size="small" onClick={() => setLogViewerOpen(true)}>
          LOGS
        </Button>
        <Button variant="outlined" size="small" onClick={handleQueueRemove(job_id)}>
          REMOVE
        </Button>
      </Stack>

      <LogViewer open={logViewerOpen} onClose={() => setLogViewerOpen(false)} jobId={job_id} />
      <SettingsViewer
        open={settingsViewerOpen}
        onClose={() => setSettingsViewerOpen(false)}
        jobId={job_id}
        handleImport={handleImport}
      />
    </Stack>
  )
}
