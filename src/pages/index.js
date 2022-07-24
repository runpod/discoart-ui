import { useEffect, useState } from "react"
// @mui
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
  Switch,
  FormControlLabel,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import { nanoid } from "nanoid"
import dynamic from "next/dynamic"
// sections

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import mapObject from "@utils/mapObject"
import { inputConfig } from "@components/DiscoInput/discoParameterConfig"
import { DynamicInput, ControlledTextField } from "@components/DiscoInput"
import useOpenState from "@hooks/useOpenState"
import Image from "next/image"
import useInterval from "@hooks/useInterval"
import useAxios from "axios-hooks"
import QueueEntry from "@components/QueueEntry"

// TODO: add real validation schema here
const validationSchema = yup.object({})

const DynamicReactJson = dynamic(import("react-json-view"), { ssr: false })

export default function Home({ customValidationSchema }) {
  const [exportedJson, setExportedJson] = useState("{}")
  const [jsonToImport, setJsonToImport] = useState("{}")
  const [{ data: jobData }, refetchJobQueue] = useAxios("/api/list")
  const [{ data: progressData, loading: progressLoading }, refetchProgress] =
    useAxios("/api/progress")
  const [exportOpen, openExportModal, closeExportModal] = useOpenState()
  const [importOpen, openImportModal, closeImportModal] = useOpenState()
  const [showAllJobs, setShowAllJobs] = useState(false)
  const [jsonValidationError, setJsonValidationError] = useState("")

  useInterval(refetchProgress, 10000)
  useInterval(refetchJobQueue, 10000)

  const { getValues, reset, control } = useForm({
    defaultValues: mapObject({ valueMapper: (value) => value?.default, mapee: inputConfig }),

    resolver: yupResolver(customValidationSchema || validationSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "text_prompts", // unique name for your Field Array
  })

  const handleImport = (jsonString) => () => {
    try {
      const newState = jsonString ? jsonToState(jsonString) : jsonToState(jsonToImport)
      reset(newState)
      setJsonValidationError("")
      closeImportModal()
    } catch (e) {
      console.log(e)
      setJsonValidationError("Invalid JSON")
    }
  }

  const handleExport = (jsonString) => () => {
    try {
      const jsonToExport = jsonString
        ? JSON.stringify(JSON.parse(jsonString), null, 2)
        : JSON.stringify(stateToJson(getValues()), null, 2)

      setExportedJson(jsonToExport)
      openExportModal()
    } catch (e) {
      console.log(e)
    }
  }

  const handleRenderStart = () => {
    const newRenderId = nanoid()

    const payload = {
      jobId: newRenderId,
      parameters: { ...stateToJson(getValues()), name_docarray: newRenderId },
    }

    fetch("/api/create", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    }).then(refetchJobQueue)
  }

  const handlePromptAdd = () => {
    append({
      prompt: "",
      weight: 1,
    })
  }

  const handlePromptRemove = (index) => () => remove(index)

  return (
    <Container maxWidth="xl">
      <Accordion
        sx={{
          mt: 10,
        }}
        defaultExpanded
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Prompt</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {fields.map((field, index) => {
              const weight = `text_prompts.${index}.weight`
              const prompt = `text_prompts.${index}.prompt`

              return (
                <Stack direction="row" alignItems="center" spacing={2} key={field.id}>
                  <IconButton onClick={handlePromptRemove(index)}>
                    <CloseIcon></CloseIcon>
                  </IconButton>
                  <Box width="100px">
                    <ControlledTextField control={control} name={weight} label="Weight" />
                  </Box>
                  <ControlledTextField control={control} name={prompt} label="Prompt" />
                </Stack>
              )
            })}
            <Button
              sx={{
                width: "200px",
              }}
              variant="outlined"
              onClick={handlePromptAdd}
              startIcon={<AddIcon></AddIcon>}
            >
              Add Prompt
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Model Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              render={({ field: { ref, onChange, ...field } }) => (
                <Autocomplete
                  multiple
                  options={inputConfig?.clip_models?.options}
                  defaultValue={inputConfig?.clip_models?.default}
                  onChange={(e, data) => {
                    onChange(data)
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Clip Models" inputRef={ref} {...field} />
                  )}
                />
              )}
              name="clip_models"
              control={control}
            />

            <DynamicInput control={control} name={"diffusion_model"} />
            <DynamicInput control={control} name={"use_secondary_model"} />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Run Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"seed"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"batch_name"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"batch_size"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"n_batches"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"steps"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"width"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"height"} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Symmetry Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"use_vertical_symmetry"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"use_horizontal_symmetry"} />
            </Grid>
          </Grid>
          <Grid mt={2} container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"transformation_percent"} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Clip Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <DynamicInput control={control} name={"cutn_batches"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3} lg={2}>
              <DynamicInput control={control} name={"clip_guidance_scale"} />
            </Grid>
          </Grid>
          <Grid mt={2} container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"cut_ic_pow"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"cut_overview"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"cut_innercut"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"cut_icgray_p"} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Miscellaneous Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"eta"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"clamp_max"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"rand_mag"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"tv_scale"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"range_scale"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"sat_scale"} />
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"clamp_grad"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"clip_denoised"} />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <DynamicInput control={control} name={"skip_augs"} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Stack sx={{ mt: 3 }} direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleRenderStart}>
            Queue Render
          </Button>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={openImportModal}>
            Import Settings
          </Button>
          <Button variant="outlined" onClick={handleExport()}>
            Export Settings
          </Button>
        </Stack>
      </Stack>
      {progressData?.progress && (
        <Grid container justifyContent="center" mt={3} mb={10}>
          <Stack alignItems="center" spacing={1} width={300}>
            <Image
              {...progressData?.progress?.dimensions}
              src={progressData?.progress?.latestImage}
            ></Image>

            <Box width="100%">
              <LinearProgress
                height={10}
                width="100%"
                sx={{
                  borderRadius: 2,
                }}
                variant="determinate"
                value={
                  (progressData?.progress?.frame / progressData?.progress?.config?.steps) * 100
                }
              />
              <LinearProgress
                height={10}
                width="100%"
                sx={{
                  borderRadius: 2,
                }}
                variant="determinate"
                value={
                  (progressData?.progress?.batchNumber /
                    progressData?.progress?.config?.n_batches) *
                  100
                }
              />
            </Box>
          </Stack>
        </Grid>
      )}
      {jobData?.jobs?.length > 0 && (
        <Stack mt={4} spacing={2} sx={{ width: "100%" }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h4">Generation Queue</Typography>
            <FormControlLabel
              label="Show Finished"
              control={
                <Switch checked={showAllJobs} onClick={() => setShowAllJobs(!showAllJobs)}></Switch>
              }
            ></FormControlLabel>
          </Stack>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="left">Created</TableCell>
                <TableCell align="left">Started</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobData?.jobs
                ?.filter(({ completed_at }) => {
                  if (showAllJobs) return true
                  else return !completed_at
                })
                ?.map((job) => (
                  <QueueEntry
                    job={job}
                    refetchJobQueue={refetchJobQueue}
                    handleImport={handleImport}
                  ></QueueEntry>
                ))}
            </TableBody>
          </Table>
        </Stack>
      )}
      <Box sx={{ width: "100%", height: 100 }}></Box>
      <Dialog fullWidth maxWidth="lg" open={exportOpen} onClose={closeExportModal}>
        <DialogContent>
          <DynamicReactJson
            displayDataTypes={false}
            displayObjectSize={false}
            src={JSON.parse(exportedJson)}
          />
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
          />
        </DialogContent>

        <DialogActions>
          <Stack direction="row" width="100%" alignItems="center" justifyContent="space-between">
            {jsonValidationError && (
              <Box sx={{ pl: 3 }}>
                <Typography variant="h5" color="red">
                  {jsonValidationError}
                </Typography>
              </Box>
            )}
            <Box>
              <Button variant="ghost" mr={3} onClick={closeImportModal}>
                Close
              </Button>
              <Button onClick={handleImport()} variant="contained">
                Import
              </Button>
            </Box>
          </Stack>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
