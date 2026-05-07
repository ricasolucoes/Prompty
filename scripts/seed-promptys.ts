/* eslint-disable */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Fixed UUIDs for deterministic seed (re-runnable). DO NOT change after first push.
const SEED_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'

type SeedPrompty = {
  slug: string
  title: string
  description: string
  template: string
  negative: string
  inputs: Array<{
    key: string
    label: string
    type: string
    value?: string | number
    options?: string[]
    required?: boolean
    min?: number
    max?: number
  }>
  models: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  style_tags: string[]
  cover_gradient: string
  created_at: string
}

const PROMPTYS: SeedPrompty[] = [
  {
    slug: 'retrato-cinematografico',
    title: 'Retrato Cinematográfico',
    description:
      'Retrato editorial premium com foto de referência opcional. Mantém traços do sujeito, aplica direção de luz cinematográfica e grading de cor refinado.',
    template: `Create a cinematic high-end portrait of {{subject_description}}.

Use the provided reference image as visual identity guidance if available:
- preserve facial structure, expression direction, posture, recognizable traits
- do not copy artifacts, low-resolution details, distortions, background noise

Scene:
The subject is in {{environment}}, wearing {{wardrobe}}, with {{pose}}.

Visual style:
{{visual_style}}, premium editorial quality, refined color grading, realistic textures.

Lighting:
{{lighting_style}}, soft highlights, controlled shadows, cinematic contrast.

Camera:
shot on {{camera_style}}, {{lens}}, shallow depth of field, sharp focus on subject.

Mood: {{mood}}, emotionally expressive, elegant.
Color palette: {{color_palette}}.
Composition: {{composition}}, clean background separation.

Technical: ultra detailed, high resolution, realistic anatomy, no text, no watermark.`,
    negative:
      'low quality, blurry, distorted face, extra fingers, bad hands, broken anatomy, duplicate body parts, text, watermark, logo, plastic skin, uncanny valley',
    inputs: [
      {
        key: 'subject_description',
        label: 'Personagem',
        type: 'text',
        required: true,
        value: 'uma astrônoma de cabelo curto, olhar concentrado',
      },
      { key: 'environment', label: 'Ambiente', type: 'text', value: 'um observatório à meia-noite' },
      { key: 'wardrobe', label: 'Figurino', type: 'text', value: 'jaleco preto técnico' },
      { key: 'pose', label: 'Pose', type: 'text', value: 'olhando para o telescópio, perfil 3/4' },
      {
        key: 'visual_style',
        label: 'Estilo visual',
        type: 'enum',
        options: [
          'cinematic realism',
          'editorial fashion',
          'dark fantasy',
          'anime detailed',
          '3D render',
          'surreal photography',
        ],
        value: 'cinematic realism',
      },
      {
        key: 'lighting_style',
        label: 'Iluminação',
        type: 'enum',
        options: [
          'softbox lighting',
          'golden hour',
          'neon rim light',
          'dramatic chiaroscuro',
          'overcast natural light',
        ],
        value: 'neon rim light',
      },
      {
        key: 'camera_style',
        label: 'Câmera',
        type: 'enum',
        options: ['Arri Alexa', 'Sony A7R IV', 'Hasselblad H6D', 'RED Komodo'],
        value: 'Arri Alexa',
      },
      {
        key: 'lens',
        label: 'Lente',
        type: 'enum',
        options: ['35mm f/1.4', '50mm f/1.2', '85mm f/1.4', '105mm macro'],
        value: '85mm f/1.4',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['contemplativo', 'tenso', 'sereno', 'épico', 'íntimo'],
        value: 'contemplativo',
      },
      {
        key: 'color_palette',
        label: 'Paleta',
        type: 'text',
        value: 'tons de azul-meia-noite, violeta e cobre',
      },
      {
        key: 'composition',
        label: 'Composição',
        type: 'enum',
        options: ['rule of thirds', 'centered close-up', 'leading lines', 'symmetric'],
        value: 'rule of thirds',
      },
    ],
    models: ['Midjourney', 'Flux', 'SDXL'],
    difficulty: 'intermediate',
    style_tags: ['retrato', 'cinematografico', 'editorial'],
    cover_gradient: 'linear-gradient(135deg,#3b1d6e 0%,#7C3AED 50%,#FF6B4A 100%)',
    created_at: '2026-04-21T12:00:00Z',
  },
  {
    slug: 'cartaz-editorial-y2k',
    title: 'Cartaz Editorial Y2K',
    description:
      'Cartaz tipográfico inspirado em revistas dos anos 2000, com tipografia agressiva, cores saturadas e textura de impressão.',
    template: `Editorial Y2K magazine cover poster featuring {{subject}}, dominant headline reading "{{headline}}".

Layout: {{layout_style}}, oversized typography, cluttered editorial energy, scanned print texture, slight chromatic aberration.

Color palette: {{palette}}.
Subject treatment: {{treatment}}, high-contrast lighting.

Decoration: small chrome stickers, holographic stars, callouts in tiny serif type.
Quality: 4k, sharp print scan look, paper grain, no real brand logos.`,
    negative:
      'modern minimal flat design, swiss style, dull colors, vector clean, generic stock photo, blurry text',
    inputs: [
      { key: 'subject', label: 'Sujeito', type: 'text', value: 'patinadora com fones grandes' },
      { key: 'headline', label: 'Headline', type: 'text', value: 'FUTURE NOW' },
      {
        key: 'layout_style',
        label: 'Layout',
        type: 'enum',
        options: ['asymmetric', 'centered chaos', 'grid-broken', 'all-caps stack'],
        value: 'centered chaos',
      },
      {
        key: 'palette',
        label: 'Paleta',
        type: 'text',
        value: 'magenta, ciano elétrico, prata cromado',
      },
      {
        key: 'treatment',
        label: 'Tratamento',
        type: 'enum',
        options: ['flash photo', 'studio lit', 'lo-fi disposable cam'],
        value: 'flash photo',
      },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    style_tags: ['poster', 'y2k', 'editorial', 'tipografia'],
    cover_gradient: 'linear-gradient(135deg,#FF6B4A 0%,#FFCC00 60%,#22D3EE 100%)',
    created_at: '2026-05-01T12:00:00Z',
  },
  {
    slug: 'brutalismo-solar',
    title: 'Brutalismo Solar',
    description:
      'Renderização arquitetônica de inspiração brutalista, banhada por luz quente e sombras longas.',
    template: `Architectural render of a brutalist building, {{building_type}}, located in {{context}}.

Materials: raw concrete, exposed aggregate, bronze accents.
Lighting: {{light_time}}, long shadows, warm ambient bounce.
Atmosphere: {{atmosphere}}.
Camera: {{camera}}, architectural composition, vertical lines preserved.

High detail, photoreal render, no people unless specified.`,
    negative: 'cartoon, watercolor, generic glass skyscraper, futuristic neon, lens distortion',
    inputs: [
      { key: 'building_type', label: 'Tipologia', type: 'text', value: 'biblioteca municipal' },
      {
        key: 'context',
        label: 'Contexto',
        type: 'text',
        value: 'morro arborizado em São Paulo',
      },
      {
        key: 'light_time',
        label: 'Luz',
        type: 'enum',
        options: ['golden hour', 'high noon', 'overcast', 'blue hour'],
        value: 'golden hour',
      },
      {
        key: 'atmosphere',
        label: 'Atmosfera',
        type: 'enum',
        options: ['poeira no ar', 'após chuva', 'limpa e seca', 'névoa baixa'],
        value: 'poeira no ar',
      },
      {
        key: 'camera',
        label: 'Câmera',
        type: 'enum',
        options: ['tilt-shift', '24mm wide', '50mm normal'],
        value: '24mm wide',
      },
    ],
    models: ['Flux', 'SDXL', 'DALL-E'],
    difficulty: 'advanced',
    style_tags: ['arquitetura', 'brutalismo', 'render'],
    cover_gradient: 'linear-gradient(135deg,#1f1d1a 0%,#FF6B4A 70%,#FFCC88 100%)',
    created_at: '2026-04-12T12:00:00Z',
  },
  {
    slug: 'mascote-claymation',
    title: 'Mascote Claymation',
    description:
      'Personagem em estilo stop-motion de massa de modelar, com câmera fofa e iluminação macro.',
    template: `Claymation stop-motion character of {{character}}, in {{pose}}, on {{set}}.

Material: visible plasticine fingerprints, soft uneven surfaces.
Lighting: macro studio softbox, gentle bounce.
Lens: macro, shallow depth of field, slight vignette.
Mood: {{mood}}, charming, handcrafted.

Render quality: photographic, NOT 3d cgi, NOT cartoon.`,
    negative:
      'pixar 3d render, vector illustration, smooth digital surfaces, photoreal human',
    inputs: [
      {
        key: 'character',
        label: 'Personagem',
        type: 'text',
        value: 'um capivara de cachecol',
      },
      { key: 'pose', label: 'Pose', type: 'text', value: 'segurando um chimarrão' },
      { key: 'set', label: 'Cenário', type: 'text', value: 'mini-cozinha com azulejo verde' },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['acolhedor', 'travesso', 'contemplativo', 'bobo'],
        value: 'acolhedor',
      },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    style_tags: ['personagem', 'stop-motion', 'claymation'],
    cover_gradient: 'linear-gradient(135deg,#34D399 0%,#22D3EE 60%,#7C3AED 100%)',
    created_at: '2026-05-03T12:00:00Z',
  },
  {
    slug: 'monograma-geometrico',
    title: 'Monograma Geométrico',
    description:
      'Logo monogramático geométrico, vetorial, ideal para marcas premium.',
    template: `Vector monogram logo of letters "{{letters}}", {{style}}, {{weight}} strokes, perfectly geometric, golden ratio proportions.

Background: pure white. Single color: {{color}}.
No text labels, no taglines, single mark only.
Style: premium, scalable, suitable for app icon.`,
    negative:
      'photograph, gradient mesh, 3d, cluttered, multiple marks, text labels, low resolution',
    inputs: [
      { key: 'letters', label: 'Letras', type: 'text', value: 'PR' },
      {
        key: 'style',
        label: 'Estilo',
        type: 'enum',
        options: ['serif sharp', 'sans rounded', 'monospaced', 'art deco'],
        value: 'sans rounded',
      },
      {
        key: 'weight',
        label: 'Peso',
        type: 'enum',
        options: ['thin', 'medium', 'bold'],
        value: 'medium',
      },
      { key: 'color', label: 'Cor', type: 'text', value: '#7C3AED' },
    ],
    models: ['Flux', 'SDXL', 'DALL-E'],
    difficulty: 'intermediate',
    style_tags: ['logo', 'vetorial', 'branding'],
    cover_gradient: 'linear-gradient(135deg,#0c1120 0%,#22D3EE 100%)',
    created_at: '2026-04-29T12:00:00Z',
  },
  {
    slug: 'still-comida-35mm',
    title: 'Still de Comida 35mm',
    description:
      'Fotografia de comida estilo editorial gastronômico, em filme 35mm, com mãos no enquadramento.',
    template: `Food still life of {{dish}}, on {{surface}}, hands gently arranging it.

Film stock: Kodak Portra 400, slight grain.
Lens: 50mm f/1.8.
Lighting: window side-light, soft shadows, warm temperature.
Composition: top-down 3/4 angle, negative space.
Styling: organic, imperfect, restaurant-grade plating.`,
    negative:
      'plastic-looking food, cgi, oversaturated, harsh ring flash, stock photography',
    inputs: [
      {
        key: 'dish',
        label: 'Prato',
        type: 'text',
        value: 'moqueca de palmito com farofa',
      },
      { key: 'surface', label: 'Superfície', type: 'text', value: 'mesa de barro envelhecida' },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    style_tags: ['comida', 'still-life', 'fotografia'],
    cover_gradient: 'linear-gradient(135deg,#3a1f0d 0%,#FF6B4A 50%,#FFE6B0 100%)',
    created_at: '2026-05-04T12:00:00Z',
  },
]

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''")
}

function arrayLiteral(arr: string[]): string {
  return `ARRAY[${arr.map((s) => `'${sqlEscape(s)}'`).join(',')}]::text[]`
}

function jsonbLiteral(obj: unknown): string {
  return `'${sqlEscape(JSON.stringify(obj))}'::jsonb`
}

let out = `-- Seed: 6 promptys + 1 demo author
-- Generated by scripts/seed-promptys.ts. Do not edit by hand. Idempotent.

-- Demo author profile (id matches a synthetic auth.users entry).
-- Skips FK to auth.users via direct insert with ON CONFLICT.
-- Step 1: ensure auth.users row exists (DEV-only pattern; uses Supabase admin-style insert).
INSERT INTO auth.users (id, instance_id, email, encrypted_password, raw_user_meta_data, email_confirmed_at, created_at, updated_at, aud, role)
VALUES (
  '${SEED_AUTHOR_ID}',
  '00000000-0000-0000-0000-000000000000',
  'demo@promptys.local',
  crypt('seed-only-no-login', gen_salt('bf')),
  '{"name":"Promptys Demo"}'::jsonb,
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Ensure profiles row exists (trigger may not fire on re-runs when auth.users row already exists).
-- Safe to insert directly as postgres superuser during seeding; ON CONFLICT handles idempotency.
INSERT INTO profiles (id, name, username)
VALUES (
  '${SEED_AUTHOR_ID}',
  'Promptys Demo',
  'promptys'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username;

-- Step 2: insert promptys (idempotent on slug)
`

for (const p of PROMPTYS) {
  out += `INSERT INTO promptys (slug, title, description, author_id, template, negative, inputs_schema, models, difficulty, style_tags, cover_gradient, status, version, created_at)
VALUES (
  '${sqlEscape(p.slug)}',
  '${sqlEscape(p.title)}',
  '${sqlEscape(p.description)}',
  '${SEED_AUTHOR_ID}',
  '${sqlEscape(p.template)}',
  '${sqlEscape(p.negative)}',
  ${jsonbLiteral(p.inputs)},
  ${arrayLiteral(p.models)},
  '${p.difficulty}',
  ${arrayLiteral(p.style_tags)},
  '${sqlEscape(p.cover_gradient)}',
  'published',
  1,
  '${p.created_at}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  template = EXCLUDED.template,
  negative = EXCLUDED.negative,
  inputs_schema = EXCLUDED.inputs_schema,
  models = EXCLUDED.models,
  difficulty = EXCLUDED.difficulty,
  style_tags = EXCLUDED.style_tags,
  cover_gradient = EXCLUDED.cover_gradient,
  updated_at = NOW();

`
}

const target = resolve(process.cwd(), 'supabase/seed.sql')
writeFileSync(target, out, 'utf8')
console.log(`Wrote ${PROMPTYS.length} promptys to ${target}`)
