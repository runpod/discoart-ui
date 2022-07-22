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
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
// sections

import { useFieldArray, useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { stateToJson, jsonToState } from "@utils/paramPort"
import mapObject from "@utils/mapObject"
import { inputConfig } from "@components/DiscoInput/discoParameterConfig"
import { DynamicInput, ControlledTextField } from "@components/DiscoInput"
import useOpenState from "@hooks/useOpenState"

// TODO: add real validation schema here
const validationSchema = yup.object({})

// TODO: make linked inputs for better UX

// ----------------------------------------------------------------------

export default function Home({ customValidationSchema }) {
  const theme = useTheme()

  const [exportedJson, setExportedJson] = useState()
  const [jsonToImport, setJsonToImport] = useState()
  const [exportOpen, openExportModal, closeExportModal] = useOpenState()
  const [importOpen, openImportModal, closeImportModal] = useOpenState()

  const {
    getValues,
    register,
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
    setExportedJson(stateToJson(getValues()))
    openExportModal()
  }

  console.log(exportedJson)

  const handlePromptAdd = () => {
    append({
      prompt: "a lighthouse",
      weight: 1,
    })
  }

  const handlePromptRemove = (index) => () => {
    remove(index)
  }

  return (
    <Container maxWidth="xl">
      <Accordion
        sx={{
          mt: 10,
        }}
        defaultExpanded
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Prompt</Typography>
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
          <Typography>Model Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <DynamicInput control={control} name={"use_secondary_model"} />
            <DynamicInput control={control} name={"diffusion_model"} />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Run Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <DynamicInput control={control} name={"batch_name"} />
            <DynamicInput control={control} name={"n_batches"} />
            <DynamicInput control={control} name={"steps"} />
            <DynamicInput control={control} name={"width"} />
            <DynamicInput control={control} name={"height"} />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Clip Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <DynamicInput control={control} name={"cutn_batches"} />
            <DynamicInput control={control} name={"clip_guidance_scale"} />
            <DynamicInput control={control} name={"cut_overview"} />
            <DynamicInput control={control} name={"cut_innercut"} />
            <DynamicInput control={control} name={"cut_icgray_p"} />
            <DynamicInput control={control} name={"cut_ic_pow"} />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Miscellaneous Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <DynamicInput control={control} name={"eta"} />
            <DynamicInput control={control} name={"clamp_max"} />
            <DynamicInput control={control} name={"rand_mag"} />
            <DynamicInput control={control} name={"tv_scale"} />
            <DynamicInput control={control} name={"range_scale"} />
            <DynamicInput control={control} name={"sat_scale"} />

            <DynamicInput control={control} name={"clamp_grad"} />
            <DynamicInput control={control} name={"clip_denoised"} />
            <DynamicInput control={control} name={"skip_augs"} />
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Stack sx={{ mt: 3 }} direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Button variant="contained">Start Render</Button>
          <Button variant="outlined">Skip Current Render</Button>
          <Button variant="outlined">Cancel Entire Batch</Button>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={handleImport}>
            Import Settings
          </Button>
          <Button variant="outlined" onClick={handleExport}>
            Export Settings
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
