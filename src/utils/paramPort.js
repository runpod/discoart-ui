import {
  getRandomSeed,
  inputConfig,
  validateSchedule,
} from "@components/DiscoInput/discoParameterConfig"
import { compose, identity, omit, pick } from "ramda"
import { parse } from "yaml"

const parseTextPrompts = (parsedJson) => {
  console.log(parsedJson)
  try {
    if (!parsedJson) return []
    // string
    if (typeof parsedJson === "string")
      return {
        prompt: parsedJson,
        weight,
      }
    else if (Array.isArray(parsedJson)) {
      return parsedJson.map((prompt) => {
        const [text, weight = 1] = prompt?.split(":")
        return {
          text,
          weight: `[${weight}]*1000`,
        }
      })
    } else if (parsedJson?.version === "1") {
      const promptArray = parsedJson?.prompts

      return promptArray
    } else if (parsedJson?.[0] && Array.isArray(parsedJson[0])) {
      const prompts = parsedJson[0]
      return prompts.map((prompt) => {
        const [text, weight = 1] = prompt?.split(":")
        return {
          text,
          weight: `[${weight}]*1000`,
        }
      })
    }
  } catch (e) {
    console.log(e)
    return [
      {
        prompt: "Unable to import text prompt",
        weight: 1,
      },
    ]
  }
}

const formatTextPrompts = (inputState) => {
  const annotatedState = {
    version: "1",
    prompts: inputState,
  }

  return annotatedState
}

const stringifyDimensions = (height, width) => [width, height]
const parseDimensions = (dimensions) => {
  if (!dimensions) return { width: 1280, height: 768 }
  return {
    width: dimensions[0],
    height: dimensions[1],
  }
}

export const stateToJson = (state, shouldFilter) => {
  // TODO: add more special parsers to make UX better

  const jsonObject = compose(
    omit(["width", "height"]),
    shouldFilter ? pick([...Object.keys(inputConfig), "width_height"]) : identity,
    (state) => {
      return {
        ...state,
        text_prompts: formatTextPrompts(state.text_prompts),
        width_height: stringifyDimensions(state.height, state.width),
        seed: state?.seed || getRandomSeed(),
      }
    },
    (state) => {
      let mappedState = {}
      Object.entries(state).forEach(([key, value]) => {
        const fieldType = inputConfig?.[key]?.type
        if (fieldType === "integer") {
          mappedState[key] = parseInt(value)
        } else if (fieldType === "float") {
          mappedState[key] = parseFloat(value)
        } else if (fieldType === "string") {
          mappedState[key] = value || null
        } else if (fieldType === "array") {
          mappedState[key] = JSON.parse(value) || null
        } else {
          mappedState[key] = value
        }
      })
      return mappedState
    }
  )(state)

  return jsonObject
}

// TODO: add more validations here
export const jsonToState = (json) => {
  const parsedState = compose(
    pick(Object.keys(inputConfig)),
    (parsed) => {
      const { height, width } = parseDimensions(parsed?.width_height)

      let transformedSchedules = {}

      Object.entries(parsed).forEach(([key, value]) => {
        try {
          const config = inputConfig?.[key]
          if (config?.type === "schedule") {
            if (!validateSchedule(value)) {
              if (config?.scheduleType === "boolean") {
                transformedSchedules[key] = `[${value ? "True" : "False"}]*1000`
              } else {
                transformedSchedules[key] = `[${value}]*1000`
              }
            }
          }
        } catch (e) {
          console.log(e)
        }
      })

      const clipModels = parsed?.clip_models

      return {
        ...parsed,
        ...transformedSchedules,
        text_prompts: parseTextPrompts(parsed?.text_prompts),
        transformation_percent: JSON.stringify(parsed?.transformation_percent),
        clip_models: clipModels || inputConfig.clip_models.default,
        width,
        height,
      }
    },
    parse
  )(json)

  return parsedState
}
