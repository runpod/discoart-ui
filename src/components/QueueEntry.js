import { Box, Button, TableCell, Stack, Typography, useTheme } from "@mui/material"
import { useState } from "react"
import { format } from "date-fns"
import LogViewer from "./LogViewer"
import SettingsViewer from "./SettingsViewer"
import Image from "next/image"
import { LoadingButton } from "@mui/lab"

export default function QueueEntry({ job, handleQueueRemove, handleImport, index }) {
  const theme = useTheme()
  const { job_id } = job

  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [settingsViewerOpen, setSettingsViewerOpen] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    setLoading(true)
    try {
      await handleQueueRemove(job_id)()
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }

  const jobDetails = JSON.parse(job?.job_details)

  return (
    <Stack
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
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography variant="h4">{index + 1}</Typography>
        <Stack>
          <Typography variant="h4">{jobDetails?.batch_name}</Typography>
          <Typography variant="subtitle1">
            {`${jobDetails?.text_prompts?.prompts?.[0]?.text?.substring(0, 50)}...`}
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" onClick={() => setSettingsViewerOpen(true)}>
          SETTINGS
        </Button>

        <LoadingButton loading={loading} variant="outlined" size="small" onClick={handleRemove}>
          CANCEL
        </LoadingButton>
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
