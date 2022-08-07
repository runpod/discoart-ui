import { useCallback, useEffect, useMemo, useState } from "react"
// @mui
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
  styled,
  linearProgressClasses,
  CircularProgress,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import { nanoid } from "nanoid"
import useMediaQuery from "@mui/material/useMediaQuery"
import CasinoIcon from "@mui/icons-material/Casino"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"
import QueueIcon from "@mui/icons-material/Queue"

import { useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import {
  getDefaultValues,
  getRandomName,
  getRandomSeed,
  inputConfig,
  validationSchema,
} from "@components/DiscoInput/discoParameterConfig"
import { DynamicInput, ControlledTextField } from "@components/DiscoInput"
import useOpenState from "@hooks/useOpenState"
import Image from "next/image"

import useSWR from "swr"
import { useDropzone } from "react-dropzone"

// server side stuff
import { getAuth } from "@utils/getAuth"
import { useLoginRedirect } from "@hooks/useLoginRedirect"

import { CURRENT_VERSION } from "@utils/constants"
import { useGlobalHelp } from "@hooks/useGlobalHelp"
import { omit } from "ramda"
import useInterval from "@hooks/useInterval"
import Queue from "@components/Queue"
import ErrorList from "@components/ErrorList"
import ProgressCarousel from "@components/ProgressCarousel"
import { LoadingButton } from "@mui/lab"

// TODO: add real validation schema here

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

  const [refreshModelAutocomplete, setRefreshModelAutocomplete] = useState(false)
  const [file, setFile] = useState()
  const [initImagePreview, setInitImagePreview] = useState()
  const [version, setVersion] = useState(CURRENT_VERSION)
  const [importSeed, , , toggleImportSeed] = useOpenState(false)

  const [loading, setLoading] = useState(false)

  const { data: jobData, mutate: refetchJobQueue } = useSWR("/api/list", null, {
    refreshInterval: 10000,
  })

  const { data: progressData, mutate: refetchProgress } = useSWR("/api/progress", null, {
    refreshInterval: 10000,
  })

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/Run-Pod/discoart-ui/main/version.txt", {
      cache: "no-store",
    })
      .then((data) => data.json())
      .then((json) => setVersion(json?.version))
  }, [])

  const [open, setOpen] = useState(false)

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen)
  }

  const [exportOpen, openExportModal, closeExportModal] = useOpenState(false)
  const [importOpen, openImportModal, closeImportModal] = useOpenState(false)
  const [jsonValidationError, setJsonValidationError] = useState("")

  const handleRandomizeSeed = () => {
    setValue("seed", getRandomSeed())
  }

  const handleRandomizeName = () => {
    setValue("batch_name", getRandomName())
  }

  const handleRoundHeight = () => {
    const height = getValues("height")
    setValue("height", Math.round(height / 64) * 64)
  }

  const handleRoundWidth = () => {
    const width = getValues("width")
    setValue("width", Math.round(width / 64) * 64)
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const [file] = acceptedFiles
    if (file) {
      setInitImagePreview(URL.createObjectURL(file))
      setFile(file)
    }
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const { getValues, reset, control, watch, handleSubmit, setValue } = useForm({
    defaultValues: getDefaultValues(),
    delayError: 500,
    resolver: yupResolver(validationSchema),
  })

  const {
    fields,
    append,
    remove,
    move: movePrompt,
  } = useFieldArray({
    control,
    name: "text_prompts",
  })

  useInterval(() => {
    localStorage.setItem("artpod-settings", JSON.stringify(getValues()))
  }, 3000)

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("artpod-settings")
      if (savedSettings) {
        const settingsObject = JSON.parse(savedSettings)

        reset(settingsObject)
      }
    } catch (e) {
      console.log(e)
    }
  }, [])

  const handleDrag = ({ source, destination }) => {
    if (destination) {
      movePrompt(source.index, destination.index)
    }
  }

  const { remove: removeClipModel, append: appendClipModel } = useFieldArray({
    control,
    name: "clip_models",
  })

  const clipModels = watch("clip_models")

  const handleImport = (jsonString) => () => {
    try {
      const newState = jsonString ? jsonToState(jsonString) : jsonToState(jsonToImport)

      reset(importSeed ? newState : omit(["seed"], newState))
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

  const handleQueueRemove = (jobId) => async () => {
    const payload = {
      jobId,
    }

    setLoading(true)

    await fetch("/api/remove", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(() => {
        refetchProgress()
        refetchJobQueue()
      })
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
  }

  const handleRenderStart = (data) => {
    setLoading(true)
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
    })
      .then(() => refetchJobQueue())
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
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

  const [queued, processing, error] = useMemo(() => {
    let processing = []
    let queued = []
    let error = []

    jobData?.jobs?.forEach((job) => {
      if (job.error) {
        error.push(job)
      } else if (job.completed_at) {
      } else if (job.processing) {
        processing.push(job)
      } else {
        queued.push(job)
      }
    })

    return [queued, processing, error]
  }, [jobData])

  return (
    <form onSubmit={handleSubmit(handleRenderStart)}>
      <Container
        maxWidth="xl"
        sx={{
          py: 0,
          m: "auto",
        }}
      >
        <Grid container spacing={4} padding={smallScreen ? 1 : 2}>
          {CURRENT_VERSION !== version && (
            <Grid item xs={12}>
              <Alert severity="info" variant="filled">
                {`Version ${version} is out! You have version ${CURRENT_VERSION}. Reset your pod to upgrade!`}
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h4">Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={4}>
                  <Grid item xs={12} display="flex" justifyContent="center">
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
                    <Button
                      sx={{
                        marginLeft: 10,
                      }}
                      onClick={() => {
                        reset(getDefaultValues())
                      }}
                      color="warning"
                      variant="outlined"
                      size="small"
                    >
                      Reset Settings
                    </Button>
                  </Grid>

                  <Grid container justifyContent="center" item xs={12}>
                    <Box width={400}>
                      <DynamicInput
                        control={control}
                        name={"batch_name"}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton onClick={handleRandomizeName}>
                              <CasinoIcon></CasinoIcon>
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider></Divider>
                  </Grid>

                  <Grid item xs={12}>
                    <DragDropContext onDragEnd={handleDrag}>
                      <div>
                        <Droppable droppableId="test-items">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {fields.map((field, index) => {
                                const weight = `text_prompts.${index}.weight`
                                const text = `text_prompts.${index}.text`

                                return (
                                  <Draggable key={field.id} draggableId={field.id} index={index}>
                                    {(provided) => (
                                      <Grid
                                        container
                                        spacing={1}
                                        mb={1}
                                        key={field.id}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                      >
                                        <Grid item xs={12} lg={8}>
                                          <Stack direction="row">
                                            <Box {...provided.dragHandleProps}>
                                              <DragIndicatorIcon></DragIndicatorIcon>
                                            </Box>

                                            <ControlledTextField
                                              multiline
                                              control={control}
                                              name={text}
                                              label="Prompt"
                                            />
                                          </Stack>
                                        </Grid>
                                        <Grid item xs={12} lg={4}>
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <ControlledTextField
                                              control={control}
                                              name={weight}
                                              label="Weight Schedule"
                                            />
                                            <IconButton onClick={handlePromptRemove(index)}>
                                              <CloseIcon></CloseIcon>
                                            </IconButton>
                                          </Stack>
                                        </Grid>
                                      </Grid>
                                    )}
                                  </Draggable>
                                )
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </DragDropContext>
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
                  <Grid item xs={6} sm={4} md={3}>
                    <DynamicInput control={control} name={"text_clip_on_cpu"} />
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
                    <DynamicInput
                      control={control}
                      name={"seed"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton onClick={handleRandomizeSeed}>
                            <CasinoIcon></CasinoIcon>
                          </IconButton>
                        </InputAdornment>
                      }
                    />
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
                    <DynamicInput
                      control={control}
                      name={"width"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton onClick={handleRoundWidth}>
                            <AutoFixHighIcon></AutoFixHighIcon>
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput
                      control={control}
                      name={"height"}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton onClick={handleRoundHeight}>
                            <AutoFixHighIcon></AutoFixHighIcon>
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput control={control} name={"init_scale"} />
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
                          <img alt="init image preview" src={initImagePreview} />
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

                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput control={control} name={"save_rate"} />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput control={control} name={"gif_fps"} />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput control={control} name={"gif_size_ratio"} />
                  </Grid>

                  <Grid item xs={12} sm={4} md={3}>
                    <DynamicInput control={control} name={"visualize_cuts"} />
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
                    <DynamicInput control={control} name={"perlin_mode"} />
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
                        <LoadingButton
                          loading={loading}
                          startIcon={<QueueIcon />}
                          loadingPosition="start"
                          variant="contained"
                          type="submit"
                        >
                          Queue Render
                        </LoadingButton>
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
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h4">{`Queue (${queued.length})`}</Typography>
              </AccordionSummary>
              <AccordionDetails>
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
                    <Queue
                      jobs={queued}
                      handleQueueRemove={handleQueueRemove}
                      handleImport={handleImport}
                    ></Queue>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          <Grid item xs={12}>
            <Divider></Divider>
          </Grid>

          <ErrorList
            open={open}
            onClose={toggleDrawer(false)}
            jobs={error}
            handleQueueRemove={handleQueueRemove}
            handleImport={handleImport}
          ></ErrorList>

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
                onChange={(e) => {
                  setJsonToImport(e?.target?.value)
                }}
                multiline
                rows={30}
              />
            </DialogContent>

            <DialogActions>
              <Stack
                direction="row"
                width="100%"
                alignItems="center"
                justifyContent="space-between"
              >
                {jsonValidationError && (
                  <Box sx={{ pl: 3 }}>
                    <Typography variant="h5" color="red">
                      {jsonValidationError}
                    </Typography>
                  </Box>
                )}
                <Box px={3}>
                  <FormControlLabel
                    control={<Switch checked={importSeed} onClick={toggleImportSeed} />}
                    label="Import Seed"
                  />
                </Box>
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
              p: {
                xs: 1,
              },
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: alpha(theme.palette.background.paper, 0.75),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{
                xs: 1,
                sm: 2,
                md: 3,
              }}
              sx={{
                p: 1,
                margin: "auto",
              }}
              justifyContent="center"
              alignItems="center"
            >
              {error.length > 0 && (
                <Button
                  size="small"
                  disabled={!error.length}
                  variant={error.length > 0 ? "contained" : "outlined"}
                  onClick={toggleDrawer(true, "error")}
                  color={error.length > 0 ? "error" : "info"}
                >{`Errors: ${error.length}`}</Button>
              )}
              <LoadingButton
                loadingPosition="start"
                startIcon={<QueueIcon />}
                loading={loading}
                size="small"
                variant="contained"
                type="submit"
              >
                Queue Render
              </LoadingButton>
            </Stack>
          </Box>
        </Grid>
      </Container>
      <Grid
        container
        padding={smallScreen ? 1 : 0}
        maxWidth="xl"
        sx={{
          py: 0,
          m: "auto",
          overflow: "visible",
        }}
      >
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h4">{`Progress Preview`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container justifyContent="center">
                <ProgressCarousel
                  progress={progressData?.progress}
                  handleQueueRemove={handleQueueRemove}
                  handleImport={handleImport}
                ></ProgressCarousel>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Box
          sx={{
            height: 100,
            width: "100%",
          }}
        ></Box>
      </Grid>
    </form>
  )
}
