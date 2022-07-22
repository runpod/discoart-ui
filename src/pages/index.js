import { useState } from "react"
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
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
// sections

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import mapObject from "@utils/mapObject"
import { inputConfig } from "@components/DiscoInput/discoParameterConfig"
import { DynamicInput, ControlledTextField } from "@components/DiscoInput"
import useOpenState from "@hooks/useOpenState"

// TODO: add real validation schema here
const validationSchema = yup.object({})

export default function Home({ customValidationSchema }) {
  const theme = useTheme()

  const [exportedJson, setExportedJson] = useState()
  const [jsonToImport, setJsonToImport] = useState()
  const [exportOpen, openExportModal, closeExportModal] = useOpenState()
  const [importOpen, openImportModal, closeImportModal] = useOpenState()

  const {
    getValues,
    register,
    watch,
    reset,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: mapObject({ valueMapper: (value) => value?.default, mapee: inputConfig }),

    resolver: yupResolver(customValidationSchema || validationSchema),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "text_prompts", // unique name for your Field Array
  })

  const submit = () => {
    // TODO make this do something
    console.log(getValues())
  }

  const handleImport = () => {
    const newState = jsonToState(jsonToImport)
    reset(newState)
    closeImportModal()
  }

  const handleExport = () => {
    setExportedJson(JSON.stringify(stateToJson(getValues()), null, 2))
    openExportModal()
  }

  console.log(exportedJson)

  const handlePromptAdd = () => {
    append({
      prompt: "a lighthouse",
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
                <Stack direction="row" spacing={2} key={field.id}>
                  <Box width="100px">
                    <ControlledTextField control={control} name={weight} label="Weight" />
                  </Box>
                  <ControlledTextField control={control} name={prompt} label="Prompt" />
                  <IconButton onClick={handlePromptRemove(index)} icon={<CloseIcon></CloseIcon>} />
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
          <Button variant="contained">Start Render</Button>
          <Button variant="outlined">Skip Current Render</Button>
          <Button variant="outlined">Cancel Entire Batch</Button>
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
