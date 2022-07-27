function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

export const inputConfig = {
  //seed
  seed: {
    type: "integer",
    default: "",
    defaultGenerator: () => getRandomInt(0, Number.MAX_SAFE_INTEGER),
    label: "Seed Value",
  },
  //general run
  batch_name: {
    type: "string",
    default: "RunPodDisco",
    label: "Batch Name",
  },
  batch_size: {
    type: "integer",
    default: 1,
    label: "Images Per Render",
  },
  n_batches: {
    type: "integer",
    default: 10,
    label: "Images Per Batch",
  },
  width: {
    type: "integer",
    default: 1280,
    label: "Width",
  },
  height: {
    type: "integer",
    default: 768,
    label: "Height",
  },
  steps: {
    type: "integer",
    default: 250,
    label: "Steps",
  },

  // prompt

  text_prompts: {
    type: "json",
    default: [
      {
        weight: 1,
        prompt:
          "A beautiful painting of a singular lighthouse, shining its light across a tumultuous sea of blood by greg rutkowski and thomas kinkade, Trending on artstation.",
      },
      {
        weight: 2,
        prompt: "Yellow color scheme, this prompt is twice as important as the first",
      },
    ],
    label: "Text Prompts",
  },

  // init_image: {
  //   default: null,
  //   type: "string",
  //   label: "Init Image Path",
  // },
  skip_steps: {
    default: 0,
    type: "integer",
    label: "Number of Steps to Skip",
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
  randomize_class: { type: "boolean", default: true, label: "Randomize Class" },
  diffusion_sampling_mode: {
    type: "select",
    default: "ddim",
    options: ["ddim", "plms"],
    label: "Diffusion Sampling Mode",
  },
  // cut stuff
  cutn_batches: { default: 4, type: "integer", label: "Number Cut Batches" },
  clip_guidance_scale: { default: 5000, type: "integer", label: "Clip Guidance Scale" },
  cut_overview: { default: "[12]*400+[4]*600", type: "string", label: "Cut Overview" },
  cut_innercut: { default: "[4]*400+[12]*600", type: "string", label: "Cut Innercut" },
  cut_icgray_p: { default: "[0.2]*400+[0]*600", type: "string", label: "Cut Innercut Gray" },
  cut_ic_pow: { default: "[1]*1000", type: "string", label: "Cut Innercut Power" },
  eta: { default: 0.8, type: "float", label: "ETA" },
  clamp_grad: { default: true, type: "boolean", label: "Clamp Grad" },
  clamp_max: { default: 0.05, type: "float", label: "Clamp Max" },
  clip_denoised: { default: false, type: "boolean", label: "Clip Denoised" },
  rand_mag: { default: 0.05, type: "float", label: "Random Mag" },
  tv_scale: { default: 0, type: "integer", label: "TV Scale" },
  range_scale: { default: 150, type: "integer", label: "Range Scale" },
  sat_scale: { default: 0, type: "integer", label: "Sat Scale" },
  skip_augs: { default: false, type: "boolean", label: "Skip Augs" },

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
  },
}
