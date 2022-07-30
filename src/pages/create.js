import { useCallback, useEffect, useState } from "react"
// @mui
import {
  Grid,
  Typography,
  Stack,
  Button,
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
  Card,
  Chip,
  TablePagination,
  useTheme,
  SwipeableDrawer,
  Divider,
  MenuItem,
  InputLabel,
  Select,
  FormControl,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import { nanoid } from "nanoid"
import { Carousel } from "react-responsive-carousel"
import useMediaQuery from "@mui/material/useMediaQuery"

// CSS

import "react-responsive-carousel/lib/styles/carousel.min.css" // requires a loader
// import "./Create.module.css"

// sections

import { useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import mapObject from "@utils/mapObject"
import { inputConfig, validationSchema } from "@components/DiscoInput/discoParameterConfig"
import { DynamicInput, ControlledTextField } from "@components/DiscoInput"
import useOpenState from "@hooks/useOpenState"
import Image from "next/image"
import QueueEntry from "@components/QueueEntry"
import useSWR from "swr"
import { useDropzone } from "react-dropzone"

// server side stuff
import { getAuth } from "@utils/getAuth"
import { useLoginRedirect } from "@hooks/useLoginRedirect"

import { CURRENT_VERSION } from "@utils/constants"
import { useGlobalHelp } from "@hooks/useGlobalHelp"

const getSubstring = (string, startString, endString) =>
  string.slice(string.lastIndexOf(startString) + 1, string.lastIndexOf(endString)).trim()

// TODO: add real validation schema here

const getThumbnailDimensions = ({ height, width, maxWidth = 80 }) => {
  try {
    const aspectRatio = height / width

    const adjustedWidth = Math.min(maxWidth, width)

    const adjustedHeight = adjustedWidth * aspectRatio

    return {
      height: adjustedHeight,
      width: adjustedWidth,
    }
  } catch (e) {
    return { height: 300, width: 400 }
  }
}

export async function getServerSideProps({ req, res }) {
  const auth = await getAuth({ req, res })

  return {
    props: auth,
  }
}

export default function Create({ loggedIn }) {
  useLoginRedirect(loggedIn)

  const theme = useTheme()
  const [globalHelp, globalHelpActions] = useGlobalHelp()
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"))
  const [exportedJson, setExportedJson] = useState()
  const [jsonToImport, setJsonToImport] = useState()
  const [additionalSettings, setAdditionalSettings] = useState("")
  const [useAdditionalSettings, setUseAdditionalSettings] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(smallScreen ? 350 : 500)
  const [refreshModelAutocomplete, setRefreshModelAutocomplete] = useState(false)
  const [file, setFile] = useState()
  const [initImagePreview, setInitImagePreview] = useState()
  const [progress, setProgress] = useState([])
  const [version, setVersion] = useState(CURRENT_VERSION)
  const [currentProgressJobId, setCurrentProgressJobId] = useState(null)
  const [progressMetrics, setProgressMetrics] = useState(null)
  const { data: jobData, mutate: refetchJobQueue } = useSWR("/api/list", null, {
    refreshInterval: 10000,
    keepPreviousData: true,
  })
  const { data: progressData } = useSWR("/api/progress", null, {
    refreshInterval: 10000,
  })
  const { data: logProgress } = useSWR(
    currentProgressJobId && `/api/logs/${currentProgressJobId}?lines=1`,
    null,
    {
      refreshInterval: 2000,
    }
  )

  useEffect(() => {
    try {
      const timeElapsed = getSubstring(logProgress?.logs, "[", "<")
      const timeRemaining = getSubstring(logProgress?.logs, "<", ",")
      const iterationSpeed = getSubstring(logProgress?.logs, ",", "/it")
      const frameProgress = getSubstring(logProgress?.logs, "|", "[")
      const [currentFrame, totalFrames] = frameProgress.split("/")

      setProgressMetrics({
        timeElapsed,
        timeRemaining,
        iterationSpeed,
        currentFrame,
        totalFrames,
      })
    } catch (e) {
      console.log(e)
      setProgressMetrics(null)
    }
  }, [logProgress])

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Run-Pod/discoart-ui/main/version.txt", {
      cache: "no-store",
    })
      .then((data) => data.json())
      .then((json) => setVersion(json?.version))
  }, [])

  useEffect(() => {
    setProgress(progressData?.progress)

    const jobId = progressData?.progress?.[0]?.jobId
    setCurrentProgressJobId(jobId)
  }, [progressData])

  const [open, setOpen] = useState(false)

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen)
  }

  const [exportOpen, openExportModal, closeExportModal] = useOpenState(false)
  const [importOpen, openImportModal, closeImportModal] = useOpenState(false)
  const [queueFilterOption, setQueueFilterOption] = useState("processing")
  const [jsonValidationError, setJsonValidationError] = useState("")

  const onDrop = useCallback(async (acceptedFiles) => {
    const [file] = acceptedFiles
    if (file) {
      setInitImagePreview(URL.createObjectURL(file))
      setFile(file)
    }
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const { getValues, reset, control, watch, handleSubmit } = useForm({
    defaultValues: mapObject({
      valueMapper: (value) => {
        if (value?.defaultGenerator) {
          return value?.defaultGenerator()
        } else {
          return value?.default
        }
      },
      mapee: inputConfig,
      delayError: 500,
    }),

    resolver: yupResolver(validationSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "text_prompts",
  })

  const { remove: removeClipModel, append: appendClipModel } = useFieldArray({
    control,
    name: "clip_models",
  })

  const clipModels = watch("clip_models")

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

  const handleExport = () => {
    try {
      const parsedAdvancedSettings = useAdditionalSettings ? JSON.parse(additionalSettings) : {}
      const jsonToExport = stateToJson({ ...getValues(), ...parsedAdvancedSettings })

      setExportedJson(JSON.stringify(jsonToExport, null, 2))
      openExportModal()
    } catch (e) {
      console.log(e)
    }
  }
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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
    }).then(() => refetchJobQueue())
  }

  const handleRenderStart = (data) => {
    const newRenderId = nanoid()

    const formData = new FormData()

    const parsedAdvancedSettings = useAdditionalSettings ? JSON.parse(additionalSettings) : {}

    const payload = {
      jobId: newRenderId,
      parameters: {
        ...stateToJson(data),
        ...parsedAdvancedSettings,
        name_docarray: newRenderId,
      },
    }

    formData.append("data", JSON.stringify(payload))
    if (file) formData.append("file", file)

    fetch("/api/create", {
      method: "POST",
      body: formData,
    }).then(() => refetchJobQueue())
  }

  const handlePromptAdd = () => {
    append({
      text: "",
      weight: "[1]*1000",
    })
  }

  const handlePromptRemove = (index) => () => {
    remove(index)
  }

  const handleCarouselChange = (index, item) => {
    const jobId = item?.props?.data_job_id
    setCurrentProgressJobId(jobId)
  }

  useEffect(() => {
    const newWidth = window.innerWidth > 800 ? 800 : window.innerWidth
    setPreviewWidth(newWidth)
  }, [])

  let processingJobCount = 0
  let queuedJobCount = 0
  let errorJobCount = 0
  let completedJobCount = 0

  const mappedJobs =
    jobData?.jobs?.map((job) => {
      if (job.error) {
        errorJobCount++
        return {
          ...job,
          disposition: "error",
        }
      } else if (job.completed_at) {
        completedJobCount++
        return {
          ...job,
          disposition: "completed",
        }
      } else if (job.started_at) {
        processingJobCount++
        return {
          ...job,
          disposition: "processing",
        }
      } else {
        queuedJobCount++
        return {
          ...job,
          disposition: "queued",
        }
      }
    }) || []

  const filteredJobs =
    mappedJobs?.filter(({ disposition }) => disposition === queueFilterOption) || []

  return (
    <form onSubmit={handleSubmit(handleRenderStart)}>
      <Grid container spacing={4} padding={smallScreen ? 1 : 2}>
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h4">Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={4}>
                {CURRENT_VERSION !== version && (
                  <Grid item xs={12}>
                    <Typography color="white">{`Version ${version} is out! You have version ${CURRENT_VERSION}. Reset your pod to upgrade!`}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    color="info"
                    label="Show Help"
                    control={
                      <Switch
                        checked={globalHelp.showHelp}
                        onClick={globalHelpActions.toggleHelp}
                      />
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  {fields.map((field, index) => {
                    const weight = `text_prompts.${index}.weight`
                    const text = `text_prompts.${index}.text`

                    return (
                      <Grid mb={2} container item spacing={1} key={field?.id} xs={12}>
                        <Grid item xs={12} lg={8}>
                          <ControlledTextField
                            multiline
                            control={control}
                            name={text}
                            label="Prompt"
                          />
                        </Grid>
                        <Grid item xs={12} lg={4}>
                          <ControlledTextField
                            control={control}
                            name={weight}
                            label="Weight Schedule"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3} md={2} lg={2}>
                          <Button
                            fullWidth={false}
                            size="small"
                            color="info"
                            variant={"outlined"}
                            onClick={handlePromptRemove(index)}
                            startIcon={<CloseIcon></CloseIcon>}
                          >
                            Remove Prompt
                          </Button>
                        </Grid>
                      </Grid>
                    )
                  })}
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth={smallScreen}
                    onClick={handlePromptAdd}
                    size="small"
                    startIcon={<AddIcon></AddIcon>}
                  >
                    Add Prompt
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <DynamicInput control={control} name={"truncate_overlength_prompt"} />
                </Grid>
                <Grid item xs={12}>
                  <Divider></Divider>
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        {clipModels?.map((option, index) => {
                          return (
                            <Grid item key={option}>
                              <Chip
                                key={option}
                                variant="outlined"
                                label={option}
                                onDelete={() => removeClipModel(index)}
                              />
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        key={refreshModelAutocomplete}
                        options={inputConfig?.["clip_models"]?.options?.filter(
                          (option) => !clipModels?.includes(option)
                        )}
                        disableCloseOnSelect={true}
                        onChange={(e, data) => {
                          appendClipModel(data)
                        }}
                        onBlur={() => setRefreshModelAutocomplete(!refreshModelAutocomplete)}
                        renderInput={(params) => (
                          <TextField label={"Add Clip Models"} {...params} size="small" />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <DynamicInput control={control} name={"diffusion_model"} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <DynamicInput control={control} name={"diffusion_sampling_mode"} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <DynamicInput control={control} name={"use_secondary_model"} />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider></Divider>
                </Grid>

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
                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"save_rate"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"skip_steps"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <Stack spacing={2}>
                    {file ? (
                      <Stack
                        spacing={2}
                        sx={{
                          borderRadius: 5,
                        }}
                      >
                        <img src={initImagePreview} />
                        <Button
                          onClick={() => {
                            setFile(null)
                            setInitImagePreview(null)
                          }}
                          variant="outlined"
                        >
                          Remove Init Image
                        </Button>
                      </Stack>
                    ) : (
                      <Card
                        {...getRootProps()}
                        sx={{
                          cursor: "pointer",
                          p: 3,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                          <Typography>Drop File Here</Typography>
                        ) : (
                          <Typography>Drop Init Image Here or Click to Select</Typography>
                        )}
                      </Card>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider></Divider>
                </Grid>

                <Grid item xs={12} sm={4} md={3} lg={2}>
                  <DynamicInput control={control} name={"use_vertical_symmetry"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3} lg={2}>
                  <DynamicInput control={control} name={"use_horizontal_symmetry"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3} lg={2}>
                  <DynamicInput control={control} name={"transformation_percent"} />
                </Grid>

                <Grid item xs={12}>
                  <Divider></Divider>
                </Grid>

                <Grid item xs={12} sm={4} md={3} lg={2}>
                  <DynamicInput control={control} name={"cutn_batches"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3} lg={2}>
                  <DynamicInput control={control} name={"clip_guidance_scale"} />
                </Grid>
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

                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"eta"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"clamp_max"} />
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

                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"clamp_grad"} />
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"skip_augs"} />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <DynamicInput control={control} name={"clip_denoised"} />
                </Grid>

                <Grid item xs={12}>
                  <Divider></Divider>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Custom additional settings in JSON format that will be sent to the server. You
                    can override existing settings or use ones that are not exposed in this UI.
                    Warning: Advanced feature!
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    color="info"
                    label="Enable Advanced Custom Settings"
                    control={
                      <Switch
                        checked={useAdditionalSettings}
                        onClick={() => setUseAdditionalSettings(!useAdditionalSettings)}
                      ></Switch>
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    disabled={!useAdditionalSettings}
                    label={"Custom Settings"}
                    value={additionalSettings}
                    onChange={(e) => setAdditionalSettings(e?.target?.value)}
                  ></TextField>
                </Grid>
                <Grid item xs={12}>
                  <Stack sx={{ mt: 3 }} direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={2}>
                      <Button variant="contained" type="submit">
                        Queue Render
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" onClick={openImportModal}>
                        Import Settings
                      </Button>
                      <Button variant="outlined" onClick={handleExport}>
                        Export Settings
                      </Button>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>

        <Grid item xs={12}>
          {progress && (
            <Card
              sx={{
                p: {
                  sm: 1,
                  md: 3,
                  lg: 6,
                },
              }}
            >
              <Grid container justifyContent="center">
                <Carousel
                  onChange={handleCarouselChange}
                  width={previewWidth}
                  infiniteLoop
                  showThumbs={!smallScreen}
                  renderThumbs={() => {
                    return progress
                      ?.filter(({ latestImage }) => latestImage)
                      ?.map(({ latestImage, dimensions }) => (
                        <Image
                          key={latestImage}
                          {...getThumbnailDimensions(dimensions)}
                          src={latestImage}
                        ></Image>
                      ))
                  }}
                >
                  {progress
                    ?.filter(({ latestImage }) => latestImage)
                    ?.map(({ latestImage, dimensions, frame, config, batchNumber, jobId }) => (
                      <Stack alignItems="center" spacing={1} data_job_id={jobId} key={latestImage}>
                        <Box
                          sx={{
                            position: "relative",
                          }}
                        >
                          <LinearProgress
                            sx={{
                              borderRadius: 5,
                              width: previewWidth * 0.8,
                              height: 20,
                            }}
                            variant="determinate"
                            value={
                              ((progressMetrics?.currentFrame || 0) /
                                (progressMetrics?.totalFrames || 100)) *
                              100
                            }
                          />
                          <Typography
                            sx={{
                              position: "absolute",
                              top: 2,
                              left: 0,
                              right: 0,
                            }}
                            fontSize={10}
                            variant="subtitle1"
                          >{`${
                            progressMetrics
                              ? `Frame: ${progressMetrics.currentFrame}/${progressMetrics?.totalFrames}   ${progressMetrics.timeElapsed}<${progressMetrics.timeRemaining}, ${progressMetrics.iterationSpeed}/it`
                              : ""
                          }`}</Typography>
                        </Box>
                        <Box
                          sx={{
                            position: "relative",
                          }}
                        >
                          <LinearProgress
                            sx={{
                              borderRadius: 5,
                              width: previewWidth * 0.8,
                              height: 20,
                            }}
                            variant="determinate"
                            value={(batchNumber / config?.n_batches) * 100}
                          ></LinearProgress>
                          <Typography
                            sx={{
                              position: "absolute",
                              top: 2,
                              left: 0,
                              right: 0,
                            }}
                            fontSize={10}
                            variant="subtitle1"
                          >{`${batchNumber}/${config?.n_batches}`}</Typography>
                        </Box>

                        {!progressMetrics && (
                          <Typography variant="h5">{logProgress?.logs || " "}</Typography>
                        )}
                        <Button
                          size="small"
                          onClick={handleQueueRemove(currentProgressJobId)}
                          variant="outlined"
                        >
                          Cancel Render
                        </Button>
                        {latestImage && (
                          <Box>
                            <Image
                              alt=""
                              {...getThumbnailDimensions({
                                ...dimensions,
                                maxWidth: previewWidth,
                              })}
                              src={latestImage}
                            />
                          </Box>
                        )}
                      </Stack>
                    ))}
                </Carousel>
              </Grid>
            </Card>
          )}
        </Grid>

        <SwipeableDrawer
          anchor="bottom"
          open={open}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
        >
          <Grid
            container
            sx={{
              p: {
                xs: 1,
                md: 3,
              },
            }}
          >
            <Grid item xs={12}>
              <Stack
                mb={2}
                direction="row"
                justifyContent="space-between"
                px={2}
                alignItems="center"
              >
                <Typography variant="h4">Generation Queue</Typography>
                <FormControl>
                  <InputLabel id="demo-simple-select-label">Job Filter</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={queueFilterOption}
                    label="Job Filter"
                    onChange={(event) => {
                      setQueueFilterOption(event.target.value)
                    }}
                  >
                    <MenuItem value={"queued"}>{`Queued: ${queuedJobCount}`}</MenuItem>
                    <MenuItem value={"processing"}>{`Processing: ${processingJobCount}`}</MenuItem>
                    <MenuItem value={"completed"}>{`Completed: ${completedJobCount}`}</MenuItem>
                    <MenuItem value={"error"}>{`Error: ${errorJobCount}`}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    {(queueFilterOption === "processing" || queueFilterOption === "completed") && (
                      <TableCell align="left">Preview</TableCell>
                    )}
                    {!smallScreen && <TableCell align="left">Created</TableCell>}
                    <TableCell align="left">Started</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    ?.map((job) => (
                      <QueueEntry
                        smallScreen={smallScreen}
                        filter={queueFilterOption}
                        key={job.job_id}
                        job={job}
                        handleQueueRemove={handleQueueRemove}
                        handleImport={handleImport}
                      ></QueueEntry>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredJobs.length || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[5, 10, 20]}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Grid>
          </Grid>
        </SwipeableDrawer>
        <Dialog fullWidth maxWidth="lg" open={exportOpen} onClose={closeExportModal}>
          <DialogContent>
            {<TextField fullWidth multiline rows={30} readOnly value={exportedJson} />}
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
        <Box
          sx={{
            height: 100,
            width: "100%",
          }}
        ></Box>
        <Box
          sx={{
            p: {
              xs: 1,
              sm: 3,
            },
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: alpha(theme.palette.background.paper, 0.75),
          }}
        >
          <Stack
            sx={{
              width: "100%",
            }}
            direction={{ xs: "column", sm: "row" }}
            spacing={{
              xs: 1,
              sm: 2,
              md: 3,
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Stack direction="row" spacing={{ xs: 0, sm: 1, md: 3 }}>
              <Chip variant="outlined" color="info" label={`Queued: ${queuedJobCount}`}></Chip>
              <Chip
                variant="outlined"
                color="info"
                label={`Processing: ${processingJobCount}`}
              ></Chip>
              <Chip variant="outlined" color="warning" label={`Error: ${errorJobCount}`}></Chip>
              <Chip
                variant="outlined"
                color="success"
                label={`Completed: ${completedJobCount}`}
              ></Chip>
            </Stack>
            <Button size="small" variant="contained" type="submit">
              Queue Render
            </Button>
            <Button size="small" color="secondary" variant="contained" onClick={toggleDrawer(true)}>
              Show Queue
            </Button>
          </Stack>
        </Box>
      </Grid>
    </form>
  )
}
