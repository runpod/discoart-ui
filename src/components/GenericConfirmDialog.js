const {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Typography,
} = require("@mui/material")
import { LoadingButton } from "@mui/lab"
import { useState } from "react"

export default function GenericConfirmDialog({ open, title, text, onClose, action, actionText }) {
  const [loading, setLoading] = useState(false)

  const handleAction = () => {
    if (typeof action === "function") {
      setLoading(true)
      action().then(() => {
        setLoading(false)
        onClose()
      })
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h3">{title}</Typography>
      </DialogTitle>
      <DialogContent>{text}</DialogContent>
      <DialogActions>
        <Button variant="ghost" mr={3} onClick={onClose}>
          Close
        </Button>
        <LoadingButton
          onClick={handleAction}
          loading={loading}
          loadingPosition="start"
          variant="contained"
        >
          {actionText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
