// Phase 2: static category and model lists for FilterChipBar in SearchPage and CategorySuggestSheet.
// A DB-driven `categories` table is deferred to a future phase (per 02-RESEARCH.md Open Question 3).
// Values match the literal labels users see on the chips — they are also stored verbatim in promptys.category.

export const CATEGORIES = [
  'Retrato',
  'Paisagem',
  'Fantasia',
  'Sci-Fi',
  'Abstrato',
  'Arquitetura',
  'Moda',
  'Comida',
  'Animais',
  'Arte digital',
] as const

export type Category = (typeof CATEGORIES)[number]

export const MODELS = ['Gemini', 'Midjourney', 'DALL·E', 'Stable Diffusion', 'Flux'] as const

export type Model = (typeof MODELS)[number]
