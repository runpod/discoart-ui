import {
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material"
import useSWR from "swr"

export default function LogViewer({ open, onClose, jobId }) {
  const { data, mutate, isLoading } = useSWR(open && `/api/logs/${jobId}`, null, {
    refreshInterval: 5000,
  })

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        {isLoading ? (
          <CircularProgress></CircularProgress>
        ) : (
          <TextField readOnly fullWidth value={data?.logs} multiline rows={30}></TextField>
        )}
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
