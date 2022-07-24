import { Button, TextField, Dialog, DialogContent, DialogActions } from "@mui/material"
import dynamic from "next/dynamic"
const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false })

export default function SettingsViewer({ open, onClose, settings, handleImport }) {
  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        {settings && (
          <DynamicReactJson
            displayDataTypes={false}
            displayObjectSize={false}
            src={JSON.parse(settings)}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(settings)
          }}
        >
          Copy to Clipboard
        </Button>
        <Button
          onClick={() => {
            handleImport()
            onClose()
          }}
          variant="contained"
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  )
}
