import { Button, Dialog, DialogContent, DialogActions } from "@mui/material"
import useAxios from "axios-hooks"
import dynamic from "next/dynamic"
const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false })

export default function SettingsViewer({ open, onClose, jobId, handleImport }) {
  const [{ data }] = useAxios(`/api/settings/${jobId}`, {
    manual: !open,
  })

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogContent>
        <DynamicReactJson displayDataTypes={false} displayObjectSize={false} src={data} />
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
        {handleImport && (
          <Button
            onClick={() => {
              handleImport()
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
