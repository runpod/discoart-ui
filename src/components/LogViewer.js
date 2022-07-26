import { Button, TextField, Dialog, DialogContent, DialogActions } from "@mui/material"
import useSWR from "swr"

export default function LogViewer({ open, onClose, jobId }) {
  const { data, mutate } = useSWR(open && `/api/logs/${jobId}`, null, {
    refreshInterval: 2000,
  })

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        <TextField readOnly fullWidth value={data?.logs} multiline rows={30}></TextField>
      </DialogContent>

      <DialogActions>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Close
        </Button>
        <Button onClick={mutate} variant="contained">
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  )
}
