import { useEffect, useState } from "react"
// @mui
import { useTheme } from "@mui/material/styles"
import {
  Grid,
  Container,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Box,
  Autocomplete,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material"
import { nanoid } from "nanoid"
import { format } from "date-fns"
// sections

import { useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import mapObject from "@utils/mapObject"
import { inputConfig } from "@components/DiscoInput/discoParameterConfig"
import useOpenState from "@hooks/useOpenState"
import useInterval from "@hooks/useInterval"
import useAxios from "axios-hooks"

// TODO: add real validation schema here
const validationSchema = yup.object({})

export default function Home({ customValidationSchema }) {
  const [exportedJson, setExportedJson] = useState()
  const [jsonToImport, setJsonToImport] = useState()
  const [{ data: jobData }, refetchJobQueue] = useAxios("/api/list")
  const [{ data: progressData }, refetchProgress] = useAxios("/api/progress")
  const [exportOpen, openExportModal, closeExportModal] = useOpenState()
  const [importOpen, openImportModal, closeImportModal] = useOpenState()

  useInterval(refetchProgress, 10000)

  const { getValues, reset, control } = useForm({
    defaultValues: mapObject({ valueMapper: (value) => value?.default, mapee: inputConfig }),

    resolver: yupResolver(customValidationSchema || validationSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "text_prompts", // unique name for your Field Array
  })

  const handleImport = () => {
    const newState = jsonToState(jsonToImport)
    reset(newState)
    closeImportModal()
  }

  const handleExport = (jsonString) => () => {
    const jsonToExport = jsonString
      ? JSON.stringify(JSON.parse(jsonString), null, 2)
      : JSON.stringify(stateToJson(getValues()), null, 2)

    setExportedJson(jsonToExport)
    openExportModal()
  }

  const handleQueueRemove = (jobId) => async () => {
    const payload = {
      jobId,
    }

    await fetch("/api/remove", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
        <Typography variant="h4">Generation Queue</Typography>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">Created</TableCell>
              <TableCell align="left">Started</TableCell>
              <TableCell align="left">Finished</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobData?.jobs?.map(
              ({ job_id, created_at, started_at, completed_at, job_details, exit_code, error }) => (
                <TableRow key={job_id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell align="left">
                    <Typography>
                      {created_at ? `${format(new Date(created_at), "MM/dd/yyyy HH:MM")}` : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="left">
                    <Typography>
                      {started_at ? `${format(new Date(started_at), "MM/dd/yyyy HH:MM")}` : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="left">
                    <Typography>
                      {completed_at ? `${format(new Date(completed_at), "MM/dd/yyyy HH:MM")}` : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography>
                      {completed_at ? `FINISHED: ${error}` : started_at ? "PROCESSING" : "WAITING"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button onClick={handleQueueRemove(job_id)}>
                      {started_at ? "CANCEL" : "REMOVE"}
                    </Button>
                    <Button onClick={handleExport(job_details)}>SETTINGS</Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </Stack>
      <Box sx={{ width: "100%", height: 100 }}></Box>
      <Dialog fullWidth maxWidth="lg" open={exportOpen} onClose={closeExportModal}>
        <DialogContent>
          <TextField fullWidth multiline readOnly value={exportedJson}></TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" mr={3} onClick={closeExportModal}>
            Close
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(exportedJson)
            }}
            variant="contained"
          >
            Copy To Clipboard
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="lg" open={importOpen} onClose={closeImportModal}>
        <DialogContent>
          <TextField
            fullWidth
            value={jsonToImport}
            onChange={(e) => setJsonToImport(e?.target?.value)}
            multiline
            rows={30}
          ></TextField>
        </DialogContent>

        <DialogActions>
          <Button variant="ghost" mr={3} onClick={closeImportModal}>
            Close
          </Button>
          <Button onClick={handleImport} variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
