import * as yup from "yup"

import mapObject from "@utils/mapObject"

const validateSchedule = (scheduleString, valueType, field) => {
  try {
    let cumulativeWeights = 0
    const scheduleRanges = scheduleString.split("+")

    scheduleRanges.forEach((schedule) => {
      const [rawValue, weight] = schedule.split("*")
      const parsedWeight = parseInt(weight)

      if (isNaN(parsedWeight) || !Number.isInteger(parsedWeight)) return false

      cumulativeWeights += parsedWeight

      if (cumulativeWeights > 1000) return false
      else {
        const value = rawValue.replace(/[\[\]]/g, "")

        if (valueType === "integer") {
          const parsedValue = parseInt(value, 10)

          if (isNaN(value) || !Number.isInteger(parsedValue)) return false
        }
        if (valueType === "float") {
          const parsedValue = parseFloat(value)

          if (isNaN(parsedValue)) return false
        }
      }
    })

    if (cumulativeWeights !== 1000) return false

    return true
  } catch (e) {
    return false
  }
}

export function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

export const getRandomSeed = () => getRandomInt(0, Math.pow(2, 23) - 1)

export const inputConfig = {
  //seed
  seed: {
    type: "integer",
    default: "",
    defaultGenerator: getRandomSeed,
    label: "Seed Value",
    validator: yup
      .number()
      .integer()
      .max(Math.pow(2, 23) - 1)
      .nullable(true)
      .transform((_, val) => (val === Number(val) ? val : null)),
  },
  //general run
  batch_name: {
    type: "string",
    default: "RunPodDisco",
    label: "Batch Name",
    validator: yup.string().max(100),
  },
  batch_size: {
    type: "integer",
    default: 1,
    label: "Images Per Render",
    validator: yup.number().integer().min(1).max(10),
  },
  n_batches: {
    type: "integer",
    default: 10,
    label: "Images Per Batch",
    validator: yup.number().integer().min(1).max(10000),
  },
  width: {
    type: "integer",
    default: 1280,
    label: "Width",
    validator: yup.number().integer().min(64).max(4096),
  },
  height: {
    type: "integer",
    default: 768,
    label: "Height",
    validator: yup.number().integer().min(64).max(4096),
  },
  steps: {
    type: "integer",
    default: 250,
    label: "Steps",
    validator: yup.number().integer().min(1).max(10000),
  },

  // prompt

  text_prompts: {
    type: "json",
    default: [
      {
        weight: "[1]*1000",
        text: "A beautiful painting of a singular lighthouse, shining its light across a tumultuous sea of blood by greg rutkowski and thomas kinkade, Trending on artstation.",
      },
      {
        weight: "[2]*1000",
        text: "Yellow color scheme, this prompt is twice as important as the first",
      },
    ],
    label: "Text Prompts",
    // validator: yup.object().shape({
    //   weight: yup.string().test("Weight", "${path} is not valid", (value) => {
    //     return validateSchedule(value, "integer", "weight")
    //   }),
    // }),
  },

  save_rate: {
    default: 20,
    type: "integer",
    label: "Progress Rate",
    validator: yup.number().integer(),
  },
  truncate_overlength_prompt: {
    default: true,
    type: "boolean",
    label: "Auto Truncate Prompt",
    validator: yup.boolean(),
  },
  // gif_fps: {
  //   default: true,
  //   type: "boolean",
  //   label: "Truncate Prompt",
  // },
  // gif_size_ratio: {
  //   default: true,
  //   type: "boolean",
  //   label: "Truncate Prompt",
  // },
  // init_image: {
  //   default: null,
  //   type: "string",
  //   label: "Init Image Path",
  // },
  skip_steps: {
    default: 0,
    type: "integer",
    label: "Number of Steps to Skip",
    validator: yup.number().integer(),
  },
  //   init_generator: {
  //     default: "perlin",
  //     type: "select",
  //     options: ["perlin", "voronoi"],
  //     label: "Initial Noise Type",
  //   },
  //   perlin_init: {
  //     default: false,
  //     type: "boolean",
  //     label: "Perlin Init",
  //   },
  //   perlin_mode: {
  //     default: "mixed",
  //     type: "select",
  //     options: ["mixed", "color", "gray"],
  //     label: "Perlin Mode",
  //   },
  //   voronoi_points: {
  //     default: 20,
  //     type: "integer",
  //     label: "Number of Voronoi Points",
  //   },
  //   voronoi_palette: {
  //     default: "default.yml",
  //     type: "string",
  //     label: "Voronoi Palette",
  //   },
  //   target_image: null,
  //   target_scale: 20000,

  // models

  clip_models: {
    default: ["RN50::openai", "ViT-B-16::openai", "ViT-B-32::openai"],
    options: [
      "RN50::openai",
      "RN50x4::openai",
      "RN50x16::openai",
      "RN50x64::openai",
      "RN101::openai",
      "ViT-B-16::openai",
      "ViT-B-32::openai",
      "ViT-L-14::openai",
      "ViT-L-14-336::openai",
      "RN50-quickgelu::openai",
      "ViT-B-32-quickgelu::openai",
      "RN50::yfcc15m",
      "RN50::cc12m",
      "RN50-quickgelu::yfcc15m",
      "RN50-quickgelu::cc12m",
      "RN101::yfcc15m",
      "RN101-quickgelu::yfcc15m",
      "ViT-B-32::laion2b_e16",
      "ViT-B-32::laion400m_e31",
      "ViT-B-32::laion400m_e32",
      "ViT-B-32-quickgelu::laion400m_e31",
      "ViT-B-32-quickgelu::laion400m_e32",
      "ViT-B-16::laion400m_e31",
      "ViT-B-16::laion400m_e32",
      "ViT-B-16-plus-240::laion400m_e31",
      "ViT-B-16-plus-240::laion400m_e32",
      "ViT-L-14::laion400m_e31",
      "ViT-L-14::laion400m_e32",
    ],
    type: "multiSelect",
    label: "Clip Models",
  },
  use_secondary_model: { type: "boolean", default: true, label: "Use Secondary Model" },
  diffusion_model: {
    type: "select",
    default: "512x512_diffusion_uncond_finetune_008100",
    options: [
      "Ukiyo-e_Diffusion_All_V1.by_thegenerativegeneration",
      "watercolordiffusion",
      "IsometricDiffusionRevrart512px",
      "pixel_art_diffusion_soft_256",
      "watercolordiffusion_2",
      "pixelartdiffusion4k",
      "PulpSciFiDiffusion",
      "PADexpanded",
      "512x512_diffusion_uncond_finetune_008100",
      "secondary",
      "portrait_generator_v001_ema_0.9999_1MM",
      "FeiArt_Handpainted_CG_Diffusion",
      "256x256_diffusion_uncond",
      "pixel_art_diffusion_hard_256",
      "256x256_openai_comics_faces_v2.by_alex_spirin_114k",
      "portrait_generator_v1.5_ema_0.9999_165000",
    ],
    label: "Diffusion Model",
  },
  randomize_class: {
    type: "boolean",
    default: true,
    label: "Randomize Class",
    validator: yup.boolean(),
  },
  diffusion_sampling_mode: {
    type: "select",
    default: "ddim",
    options: ["ddim", "plms"],
    label: "Diffusion Sampling Mode",
  },
  // cut stuff
  cutn_batches: {
    default: 4,
    type: "integer",
    label: "Number Cut Batches",
    validator: yup.number().integer(),
  },
  clip_guidance_scale: {
    default: 5000,
    type: "integer",
    label: "Clip Guidance Scale",
    validator: yup.number().integer(),
  },
  cut_overview: {
    default: "[12]*400+[4]*600",
    type: "string",
    label: "Cut Overview",
    validator: yup.string().test("Cut Overview", "${path} is not valid", (value) => {
      return validateSchedule(value, "integer")
    }),
  },
  cut_innercut: {
    default: "[4]*400+[12]*600",
    type: "string",
    label: "Cut Innercut",
    validator: yup.string().test("Cut Innercut", "${path} is not valid", (value) => {
      return validateSchedule(value, "integer")
    }),
  },
  cut_icgray_p: {
    default: "[0.2]*400+[0]*600",
    type: "string",
    label: "Cut Innercut Gray",
    validator: yup.string().test("Cut Innercut Gray", "${path} is not valid", (value) => {
      return validateSchedule(value, "float", "gray")
    }),
  },
  cut_ic_pow: {
    default: "[1]*1000",
    type: "string",
    label: "Cut Innercut Power",
    validator: yup.string().test("Cut Innercut Power", "${path} is not valid", (value) => {
      return validateSchedule(value, "integer", "cut_ic_pow")
    }),
  },
  eta: { default: 0.8, type: "float", label: "ETA", validator: yup.number() },
  clamp_grad: { default: true, type: "boolean", label: "Clamp Grad", validator: yup.boolean() },
  clamp_max: { default: 0.05, type: "float", label: "Clamp Max", validator: yup.number() },
  clip_denoised: {
    default: false,
    type: "boolean",
    label: "Clip Denoised",
    validator: yup.boolean(),
  },
  rand_mag: { default: 0.05, type: "float", label: "Random Mag", validator: yup.number() },
  tv_scale: { default: 0, type: "integer", label: "TV Scale", validator: yup.number().integer() },
  range_scale: { default: 150, type: "integer", label: "Range Scale", validator: yup.number() },
  sat_scale: { default: 0, type: "integer", label: "Sat Scale", validator: yup.number() },
  skip_augs: { default: false, type: "boolean", label: "Skip Augs", validator: yup.boolean() },

  //symmetry
  use_vertical_symmetry: {
    default: false,
    type: "boolean",
    label: "Vertical Symmetry",
  },
  use_horizontal_symmetry: {
    default: false,
    type: "boolean",
    label: "Horizontal Symmetry",
  },
  transformation_percent: {
    default: "[0.09]",
    type: "array",
    label: "Transformation Percent",
    // validator: yup.array().of(yup.number()),
  },
}

export const validationSchema = yup.object().shape(
  mapObject({
    valueMapper: ({ validator }) => validator,
    mapee: inputConfig,
    allowNull: false,
  })
)
