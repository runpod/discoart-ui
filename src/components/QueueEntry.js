import { Box, Button, TableCell, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { format } from "date-fns"
import LogViewer from "./LogViewer"
import SettingsViewer from "./SettingsViewer"
import Image from "next/image"

export default function QueueEntry({ job, handleQueueRemove, handleImport, smallScreen }) {
  const { job_id, created_at, started_at, completed_at, error } = job

  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [settingsViewerOpen, setSettingsViewerOpen] = useState(false)

  return (
    <TableRow key={job_id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      {started_at && !error && (
        <TableCell align="left">
          <Box
            sx={{
              position: "relative",
              objectFit: "cover",
              height: 75,
              width: 100,
            }}
          >
            <Image layout="fill" src={`/api/image/${job_id}/0-done-0.png`}></Image>
          </Box>
        </TableCell>
      )}

      {!smallScreen && (
        <TableCell align="left">
          <Typography>
            {started_at ? `${format(new Date(started_at), "MM/dd/yyyy HH:MM:ss")}` : "-"}
          </Typography>
        </TableCell>
      )}
      <TableCell align="right">
        <Typography>
          {error ? "ERROR" : completed_at ? "FINISHED" : started_at ? "PROCESSING" : "QUEUED"}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Button onClick={handleQueueRemove(job_id)}>
          {completed_at ? "REMOVE" : started_at ? "CANCEL" : "REMOVE"}
        </Button>
        {completed_at && <Button href={`/gallery/${job_id}`}>GALLERY</Button>}
        <Button onClick={() => setSettingsViewerOpen(true)}>SETTINGS</Button>
        <Button disabled={!started_at} onClick={() => setLogViewerOpen(true)}>
          LOGS
        </Button>
      </TableCell>
      <LogViewer open={logViewerOpen} onClose={() => setLogViewerOpen(false)} jobId={job_id} />
      <SettingsViewer
        open={settingsViewerOpen}
        onClose={() => setSettingsViewerOpen(false)}
        jobId={job_id}
        handleImport={handleImport}
      />
    </TableRow>
  )
}
