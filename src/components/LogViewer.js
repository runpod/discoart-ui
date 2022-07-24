import { Button, TextField, Dialog, DialogContent, DialogActions } from "@mui/material"
import useInterval from "@hooks/useInterval"
import useAxios from "axios-hooks"

export default function LogViewer({ open, onClose, jobId }) {
  const [{ data }, refetch] = useAxios(`/api/logs/${jobId}`, {
    manual: !open,
  })

  useInterval(() => {
    if (open) refetch
  }, 10000)

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        <TextField readonly fullWidth value={data?.logs} multiline rows={30}></TextField>
      </DialogContent>

      <DialogActions>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Close
        </Button>
        <Button onClick={refetch} variant="contained">
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  )
}
