import { Button, Dialog, DialogContent, DialogActions, TextField } from "@mui/material"
import useSWR from "swr"

export default function SettingsViewer({ open, onClose, jobId, handleImport }) {
  const { data } = useSWR(open && `/api/settings/${jobId}`)

  const jsonData = JSON.stringify(data, null, 2)

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        <TextField multiline fullWidth rows={30} value={jsonData} />
      </DialogContent>

      <DialogActions>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(jsonData)
          }}
        >
          Copy to Clipboard
        </Button>
        {handleImport && (
          <Button
            onClick={() => {
              handleImport(jsonData)()
              onClose()
            }}
            variant="contained"
          >
            Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
