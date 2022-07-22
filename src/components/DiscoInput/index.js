import { Controller } from "react-hook-form"
import { TextField, Checkbox, FormControlLabel, Autocomplete } from "@mui/material"

import { inputConfig } from "./discoParameterConfig"

export const DynamicInput = ({ control, name, ...rest }) => {
  const { type, label, options, default: defaultValue } = inputConfig[name]

  return type && type === "string" ? (
    <ControlledTextField control={control} name={name} label={label} {...rest} />
  ) : type === "integer" ? (
    <ControlledTextField control={control} name={name} label={label} {...rest} />
  ) : type === "float" ? (
    <ControlledTextField control={control} name={name} label={label} {...rest} />
  ) : type === "json" ? (
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
      render={({ field: { ref, onChange, ...field } }) => (
        <Autocomplete
          options={options}
          defaultValue={defaultValue}
          onChange={(e, data) => {
            onChange(data)
          }}
          renderInput={(params) => (
            <TextField {...params} label={label} inputRef={ref} {...textFieldProps} {...field} />
          )}
          {...autoCompleteProps}
        />
      )}
      name={name}
      control={control}
    />
  )
}
