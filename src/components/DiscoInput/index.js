import { Controller } from "react-hook-form"
import { Box, TextField, Checkbox, FormControlLabel, Autocomplete, Typography } from "@mui/material"
import { useGlobalHelp } from "@hooks/useGlobalHelp"

import { inputConfig } from "./discoParameterConfig"
import { helpDescriptions } from "./helpDescriptions"

export const DynamicInput = ({ control, name, ...rest }) => {
  const [globalHelp] = useGlobalHelp()
  const { type, label, options, default: defaultValue } = inputConfig[name]
  const helpText = helpDescriptions[name]

  const Input =
    type && type === "string" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "schedule" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "integer" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "float" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "json" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "array" ? (
      <ControlledTextField control={control} name={name} label={label} {...rest} />
    ) : type === "boolean" ? (
      <ControlledCheckbox control={control} name={name} label={label} {...rest} />
    ) : type === "select" ? (
      <ControlledAutocomplete
        control={control}
        name={name}
        label={label}
        options={options}
        defaultValue={defaultValue}
        {...rest}
      />
    ) : null

  return globalHelp?.showHelp ? (
    <>
      {Input}
      <Box
        sx={{
          px: 1,
        }}
      >
        <Typography fontSize={11} variant="subtitle1">
          {helpText}
        </Typography>
      </Box>
    </>
  ) : (
    Input
  )
}

export const ControlledTextField = ({
  prefix,
  control,
  name,
  startAdornment,
  endAdornment,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          size="small"
          {...props}
          fullWidth
          {...field}
          error={error}
          inputRef={field.ref}
          InputProps={{
            endAdornment,
            startAdornment,
          }}
        />
      )}
    />
  )
}

const ControlledCheckbox = ({ control, name, endAdornment, label, ...props }) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControlLabel
          size="small"
          control={<Checkbox {...props} {...field} checked={field.value} error={error} />}
          label={label}
        />
      )}
    />
  )
}

export const ControlledAutocomplete = ({
  options = [],
  control,
  defaultValue,
  name,
  label,
  autoCompleteProps,
  textFieldProps,
}) => {
  return (
    <Controller
      render={({ field: { ref, onChange, value, ...field } }) => (
        <Autocomplete
          options={options}
          defaultValue={defaultValue}
          onChange={(e, data) => {
            onChange(data)
          }}
          renderInput={(params) => (
            <TextField
              label={label}
              inputRef={ref}
              {...textFieldProps}
              {...field}
              {...params}
              size="small"
            />
          )}
          {...autoCompleteProps}
        />
      )}
      name={name}
      control={control}
    />
  )
}
