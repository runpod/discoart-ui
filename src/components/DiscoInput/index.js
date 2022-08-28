import { Controller, useController } from "react-hook-form"
import { Box, TextField, Checkbox, FormControlLabel, Autocomplete, Typography } from "@mui/material"
import { useGlobalHelp } from "@hooks/useGlobalHelp"

import { inputConfig } from "./discoParameterConfig"
import { helpDescriptions } from "./helpDescriptions"
import { useEffect, useState } from "react"

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
          helperText={error?.message}
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
  const {
    field: { onChange, value, ref },
  } = useController({
    name,
    control,
  })

  const [inputValue, setInputValue] = useState(defaultValue)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  return (
    <Autocomplete
      disableClearable
      options={options}
      defaultValue={defaultValue}
      onChange={(e, data) => {
        onChange(data)
      }}
      value={value}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue)
      }}
      renderInput={(params) => (
        <TextField label={label} inputRef={ref} {...textFieldProps} {...params} size="small" />
      )}
      {...autoCompleteProps}
    />
  )
}
