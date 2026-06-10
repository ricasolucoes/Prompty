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
  // Matches CATEGORIES in src/lib/constants/categories.ts (stored verbatim so the feed filter works).
  category: string
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
    models: ['Midjourney', 'Flux', 'Stable Diffusion'],
    difficulty: 'intermediate',
    category: 'Retrato',
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
    category: 'Arte digital',
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
    models: ['Flux', 'Stable Diffusion', 'DALL·E'],
    difficulty: 'advanced',
    category: 'Arquitetura',
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
    category: 'Animais',
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
    models: ['Flux', 'Stable Diffusion', 'DALL·E'],
    difficulty: 'intermediate',
    category: 'Arte digital',
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
    category: 'Comida',
    style_tags: ['comida', 'still-life', 'fotografia'],
    cover_gradient: 'linear-gradient(135deg,#3a1f0d 0%,#FF6B4A 50%,#FFE6B0 100%)',
    created_at: '2026-05-04T12:00:00Z',
  },

  // ─── Lote 2: cobertura de categorias + conteúdo para escalar de nível ───

  {
    slug: 'headshot-corporativo-linkedin',
    title: 'Headshot Corporativo',
    description:
      'Foto de perfil profissional para LinkedIn a partir de uma selfie. Fundo neutro, luz de estúdio e roupa formal.',
    template: `Professional corporate headshot of {{subject}}, looking confidently toward the camera.

Use the reference selfie only to preserve identity (face shape, features). Improve lighting and framing.

Wardrobe: {{wardrobe}}.
Background: {{background}}, softly blurred.
Lighting: clean three-point studio lighting, flattering and even.
Framing: shoulders-up, eye level, {{aspect}}.
Expression: {{expression}}, approachable and competent.

Technical: sharp focus on eyes, realistic skin texture, no harsh shadows, no text, no watermark.`,
    negative:
      'cartoon, oversmoothed skin, plastic look, distorted features, busy background, low resolution, extra limbs',
    inputs: [
      { key: 'subject', label: 'Pessoa', type: 'text', required: true, value: 'um profissional de tecnologia, 30 anos' },
      {
        key: 'wardrobe',
        label: 'Roupa',
        type: 'enum',
        options: ['blazer azul-marinho', 'camisa branca social', 'suéter neutro', 'terno cinza'],
        value: 'blazer azul-marinho',
      },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['cinza estúdio', 'escritório desfocado', 'branco clean', 'verde-escuro suave'],
        value: 'cinza estúdio',
      },
      {
        key: 'aspect',
        label: 'Enquadramento',
        type: 'enum',
        options: ['quadrado 1:1', 'retrato 4:5'],
        value: 'quadrado 1:1',
      },
      {
        key: 'expression',
        label: 'Expressão',
        type: 'enum',
        options: ['sorriso leve', 'neutra confiante', 'amigável aberta'],
        value: 'sorriso leve',
      },
    ],
    models: ['Gemini', 'Flux', 'Midjourney'],
    difficulty: 'beginner',
    category: 'Retrato',
    style_tags: ['headshot', 'profissional', 'linkedin'],
    cover_gradient: 'linear-gradient(135deg,#0c1120 0%,#334155 60%,#22D3EE 100%)',
    created_at: '2026-05-06T12:00:00Z',
  },
  {
    slug: 'amanhecer-montanhas-epico',
    title: 'Amanhecer nas Montanhas',
    description:
      'Paisagem natural grandiosa ao nascer do sol, com mar de nuvens e luz dourada cortando os vales.',
    template: `Epic landscape photograph of {{location}} at {{time_of_day}}.

Foreground: {{foreground}}.
Atmosphere: {{atmosphere}}, layered depth, sea of clouds in the valleys.
Light: warm directional sunlight grazing the peaks, long soft shadows.
Camera: wide angle 16-35mm, deep focus, tripod long exposure feel.
Mood: {{mood}}, vast and serene.

Technical: ultra high resolution, natural color, realistic atmospheric haze, no text.`,
    negative:
      'oversaturated hdr, fake colors, cartoon, blurry, people, buildings, watermark, text',
    inputs: [
      { key: 'location', label: 'Local', type: 'text', value: 'a Serra dos Órgãos' },
      {
        key: 'time_of_day',
        label: 'Hora',
        type: 'enum',
        options: ['nascer do sol', 'hora dourada', 'hora azul', 'pôr do sol'],
        value: 'nascer do sol',
      },
      { key: 'foreground', label: 'Primeiro plano', type: 'text', value: 'rochas cobertas de musgo e uma árvore solitária' },
      {
        key: 'atmosphere',
        label: 'Atmosfera',
        type: 'enum',
        options: ['mar de nuvens', 'névoa fina', 'céu limpo', 'tempestade se formando'],
        value: 'mar de nuvens',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['sereno', 'épico', 'melancólico', 'esperançoso'],
        value: 'épico',
      },
    ],
    models: ['Gemini', 'Flux', 'Midjourney'],
    difficulty: 'beginner',
    category: 'Paisagem',
    style_tags: ['paisagem', 'natureza', 'montanha', 'amanhecer'],
    cover_gradient: 'linear-gradient(135deg,#1e3a5f 0%,#FF6B4A 60%,#FFD27A 100%)',
    created_at: '2026-05-07T12:00:00Z',
  },
  {
    slug: 'cidade-na-neblina',
    title: 'Cidade na Neblina',
    description:
      'Paisagem urbana atmosférica vista do alto, com arranha-céus emergindo de uma névoa densa.',
    template: `Atmospheric cityscape of {{city_type}} emerging from {{weather}}, seen from {{viewpoint}}.

Only the tallest towers pierce the fog, soft silhouettes fading into grey.
Light: {{light}}, muted palette, cinematic depth.
Mood: {{mood}}, quiet and immense.
Camera: telephoto compression, layered planes.

Technical: photoreal, fine atmospheric gradient, subtle film grain, no text, no watermark.`,
    negative:
      'clear sunny sky, oversaturated, neon, cartoon, cluttered, lens flare, text',
    inputs: [
      { key: 'city_type', label: 'Cidade', type: 'text', value: 'uma metrópole moderna' },
      {
        key: 'weather',
        label: 'Clima',
        type: 'enum',
        options: ['neblina densa', 'névoa matinal', 'nuvens baixas', 'chuva fina'],
        value: 'neblina densa',
      },
      {
        key: 'viewpoint',
        label: 'Ponto de vista',
        type: 'enum',
        options: ['de um terraço alto', 'de um drone', 'de uma colina distante'],
        value: 'de um terraço alto',
      },
      {
        key: 'light',
        label: 'Luz',
        type: 'enum',
        options: ['hora azul', 'amanhecer cinza', 'entardecer difuso'],
        value: 'hora azul',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['contemplativo', 'misterioso', 'melancólico', 'sereno'],
        value: 'misterioso',
      },
    ],
    models: ['Flux', 'Stable Diffusion', 'Midjourney'],
    difficulty: 'intermediate',
    category: 'Paisagem',
    style_tags: ['paisagem', 'urbano', 'neblina', 'atmosferico'],
    cover_gradient: 'linear-gradient(135deg,#243447 0%,#5a6b7a 60%,#cdd6df 100%)',
    created_at: '2026-04-25T12:00:00Z',
  },
  {
    slug: 'floresta-encantada',
    title: 'Floresta Encantada',
    description:
      'Cena de fantasia luminosa: floresta mágica com partículas flutuantes, cogumelos bioluminescentes e luz volumétrica.',
    template: `Enchanted fantasy forest scene with {{focal_element}}.

Environment: ancient trees, glowing {{bioluminescence}}, drifting light particles, soft mist.
Light: volumetric god rays piercing the canopy, magical glow, {{palette}}.
Atmosphere: {{mood}}, dreamlike and immersive.
Camera: cinematic wide shot, shallow depth of field on the focal element.

Technical: highly detailed, painterly realism, rich color, no text, no watermark.`,
    negative:
      'flat lighting, dull colors, modern objects, text, watermark, low detail, blurry',
    inputs: [
      { key: 'focal_element', label: 'Elemento central', type: 'text', required: true, value: 'uma raposa branca com olhos azuis brilhantes' },
      {
        key: 'bioluminescence',
        label: 'Bioluminescência',
        type: 'enum',
        options: ['cogumelos azuis', 'flores douradas', 'fungos turquesa', 'vaga-lumes'],
        value: 'cogumelos azuis',
      },
      {
        key: 'palette',
        label: 'Paleta',
        type: 'text',
        value: 'verde-esmeralda, ciano e dourado',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['mágico', 'misterioso', 'sereno', 'épico'],
        value: 'mágico',
      },
    ],
    models: ['Midjourney', 'Flux', 'Stable Diffusion'],
    difficulty: 'intermediate',
    category: 'Fantasia',
    style_tags: ['fantasia', 'floresta', 'magia', 'concept-art'],
    cover_gradient: 'linear-gradient(135deg,#04140f 0%,#0f7a5a 55%,#34D399 100%)',
    created_at: '2026-05-02T12:00:00Z',
  },
  {
    slug: 'dragao-anciao',
    title: 'Dragão Ancião',
    description:
      'Concept art épico de uma criatura colossal, com anatomia detalhada, escamas texturizadas e iluminação dramática.',
    template: `Epic concept art of an ancient colossal dragon, {{descriptor}}, perched on {{location}}.

Anatomy: massive scaled body, detailed wing membranes, weathered horns, expressive reptilian eye.
Scale: dwarfing the environment, {{scale_cue}} for size reference.
Light: {{lighting}}, dramatic rim light, volumetric atmosphere.
Palette: {{palette}}.
Mood: {{mood}}, awe-inspiring.
Camera: low angle hero shot, cinematic composition.

Technical: ultra detailed, photoreal creature design, ArtStation quality, no text, no watermark.`,
    negative:
      'cute, cartoon, low detail, flat lighting, deformed anatomy, extra heads, text, watermark',
    inputs: [
      { key: 'descriptor', label: 'Aparência', type: 'text', value: 'escamas de obsidiana com veios de brasa' },
      { key: 'location', label: 'Local', type: 'text', value: 'as ruínas de um castelo na montanha' },
      {
        key: 'scale_cue',
        label: 'Referência de escala',
        type: 'text',
        value: 'cavaleiros minúsculos ao fundo',
      },
      {
        key: 'lighting',
        label: 'Iluminação',
        type: 'enum',
        options: ['pôr do sol em chamas', 'tempestade com relâmpagos', 'luar frio', 'névoa ao amanhecer'],
        value: 'tempestade com relâmpagos',
      },
      {
        key: 'palette',
        label: 'Paleta',
        type: 'text',
        value: 'preto, brasa-laranja e cinza tempestade',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['ameaçador', 'majestoso', 'melancólico', 'épico'],
        value: 'majestoso',
      },
    ],
    models: ['Midjourney', 'Stable Diffusion', 'Flux'],
    difficulty: 'advanced',
    category: 'Fantasia',
    style_tags: ['fantasia', 'criatura', 'dragao', 'concept-art'],
    cover_gradient: 'linear-gradient(135deg,#0a0a0a 0%,#7c2d12 55%,#FF6B4A 100%)',
    created_at: '2026-04-18T12:00:00Z',
  },
  {
    slug: 'cidade-cyberpunk-neon',
    title: 'Cidade Cyberpunk Neon',
    description:
      'Beco futurista sob chuva, com letreiros de neon, reflexos no asfalto molhado e atmosfera blade-runner.',
    template: `Cyberpunk city alley at night, {{focal}}, drenched in rain.

Environment: towering megastructures, dense neon signage in {{languages}}, holographic ads, steam vents.
Reflections: wet asphalt mirroring neon, puddles, volumetric haze.
Palette: {{palette}}, high contrast neon glow.
Mood: {{mood}}, blade-runner atmosphere.
Camera: {{camera}}, anamorphic lens flares.

Technical: ultra detailed, cinematic, photoreal, no text overlays, no watermark.`,
    negative:
      'daylight, clean clear sky, rural, cartoon, flat, low detail, washed out, watermark',
    inputs: [
      { key: 'focal', label: 'Elemento central', type: 'text', value: 'uma figura solitária de capuz vista de costas' },
      {
        key: 'languages',
        label: 'Letreiros',
        type: 'enum',
        options: ['japonês e inglês', 'coreano', 'chinês', 'glifos fictícios'],
        value: 'japonês e inglês',
      },
      {
        key: 'palette',
        label: 'Paleta',
        type: 'text',
        value: 'magenta, ciano e violeta elétrico',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['solitário', 'tenso', 'hipnótico', 'decadente'],
        value: 'solitário',
      },
      {
        key: 'camera',
        label: 'Câmera',
        type: 'enum',
        options: ['street level wide', 'plano médio do personagem', 'vista de cima'],
        value: 'street level wide',
      },
    ],
    models: ['Flux', 'Stable Diffusion', 'Midjourney'],
    difficulty: 'intermediate',
    category: 'Sci-Fi',
    style_tags: ['sci-fi', 'cyberpunk', 'neon', 'cidade'],
    cover_gradient: 'linear-gradient(135deg,#0b0226 0%,#7C3AED 50%,#22D3EE 100%)',
    created_at: '2026-04-15T12:00:00Z',
  },
  {
    slug: 'nave-exploradora-orbital',
    title: 'Nave Exploradora Orbital',
    description:
      'Hard sci-fi: uma nave de exploração detalhada orbitando um planeta alienígena, com iluminação realista do espaço.',
    template: `Hard science-fiction render of {{ship_type}} orbiting {{planet}}.

Ship design: detailed hull paneling, radiators, antennae, realistic engineering, weathered surface.
Environment: {{planet}} below, {{space_feature}} in the background, deep starfield.
Light: harsh directional sunlight, deep black shadows, subtle planet bounce light.
Mood: {{mood}}, vast scale.
Camera: cinematic three-quarter angle, lens 35mm.

Technical: photoreal CGI, NASA-plausible, ultra detailed, no text, no watermark.`,
    negative:
      'fantasy, magic, cartoon, fighter jet in space, glowing magic, atmospheric haze in vacuum, text, watermark',
    inputs: [
      { key: 'ship_type', label: 'Tipo de nave', type: 'text', value: 'uma nave de pesquisa de longo alcance' },
      { key: 'planet', label: 'Planeta', type: 'text', value: 'um gigante gasoso âmbar com anéis' },
      {
        key: 'space_feature',
        label: 'Fundo',
        type: 'enum',
        options: ['uma nebulosa distante', 'duas luas', 'um campo de asteroides', 'uma estrela binária'],
        value: 'uma nebulosa distante',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['solitário', 'majestoso', 'tenso', 'sereno'],
        value: 'majestoso',
      },
    ],
    models: ['Flux', 'Stable Diffusion', 'DALL·E'],
    difficulty: 'advanced',
    category: 'Sci-Fi',
    style_tags: ['sci-fi', 'espaco', 'nave', 'hard-scifi'],
    cover_gradient: 'linear-gradient(135deg,#02030a 0%,#1e3a5f 55%,#FFB85C 100%)',
    created_at: '2026-04-10T12:00:00Z',
  },
  {
    slug: 'fluido-iridescente',
    title: 'Fluido Iridescente',
    description:
      'Arte abstrata de fluidos em alta velocidade, com cores iridescentes, tensão superficial e fundo escuro.',
    template: `Abstract macro of {{substance}} in motion, frozen mid-splash.

Form: smooth flowing curves, surface tension droplets, {{texture}}.
Color: iridescent {{palette}}, soft gradients, subtle metallic sheen.
Background: {{background}}.
Light: studio gradient light, gentle specular highlights.
Composition: {{composition}}, elegant negative space.

Technical: ultra sharp macro, high resolution, clean render, no text, no watermark.`,
    negative:
      'recognizable objects, text, faces, cluttered, muddy colors, noise, watermark',
    inputs: [
      {
        key: 'substance',
        label: 'Substância',
        type: 'enum',
        options: ['tinta na água', 'metal líquido', 'seda fluida', 'óleo iridescente'],
        value: 'metal líquido',
      },
      {
        key: 'texture',
        label: 'Textura',
        type: 'enum',
        options: ['cetim suave', 'cromado espelhado', 'fosco aveludado'],
        value: 'cromado espelhado',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'violeta, ciano e rosa pérola' },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['preto profundo', 'gradiente escuro', 'branco minimalista'],
        value: 'preto profundo',
      },
      {
        key: 'composition',
        label: 'Composição',
        type: 'enum',
        options: ['centralizada', 'diagonal dinâmica', 'regra dos terços'],
        value: 'diagonal dinâmica',
      },
    ],
    models: ['Flux', 'Midjourney', 'Stable Diffusion'],
    difficulty: 'beginner',
    category: 'Abstrato',
    style_tags: ['abstrato', 'fluido', 'macro', 'iridescente'],
    cover_gradient: 'linear-gradient(135deg,#0a0118 0%,#7C3AED 50%,#22D3EE 100%)',
    created_at: '2026-05-05T12:00:00Z',
  },
  {
    slug: 'geometria-sagrada',
    title: 'Geometria Sagrada',
    description:
      'Composição abstrata simétrica com padrões geométricos intrincados, mandalas e profundidade fractal.',
    template: `Symmetric abstract composition built from {{motif}}, intricate sacred geometry.

Structure: perfect radial symmetry, nested mandala patterns, {{detail_level}} fractal detail.
Material: {{material}}, fine line work, subtle depth and glow.
Palette: {{palette}} on {{background}}.
Mood: {{mood}}, meditative and precise.

Technical: razor-sharp lines, hi-res, perfectly centered, no text, no watermark.`,
    negative:
      'asymmetric, messy, hand-drawn wobble, photo, faces, text, watermark, low resolution',
    inputs: [
      {
        key: 'motif',
        label: 'Motivo',
        type: 'enum',
        options: ['flor da vida', 'metatron', 'mandala floral', 'malha hexagonal'],
        value: 'mandala floral',
      },
      {
        key: 'detail_level',
        label: 'Nível de detalhe',
        type: 'enum',
        options: ['moderado', 'intrincado', 'extremamente denso'],
        value: 'intrincado',
      },
      {
        key: 'material',
        label: 'Material',
        type: 'enum',
        options: ['linhas de luz neon', 'ouro gravado', 'vitral', 'tinta sobre papel'],
        value: 'linhas de luz neon',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'ciano, violeta e magenta' },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['preto profundo', 'azul-meia-noite', 'branco'],
        value: 'preto profundo',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['meditativo', 'hipnótico', 'cósmico'],
        value: 'hipnótico',
      },
    ],
    models: ['Stable Diffusion', 'Flux', 'Midjourney'],
    difficulty: 'intermediate',
    category: 'Abstrato',
    style_tags: ['abstrato', 'geometria', 'mandala', 'simetria'],
    cover_gradient: 'linear-gradient(135deg,#05010f 0%,#3b1d6e 55%,#22D3EE 100%)',
    created_at: '2026-04-22T12:00:00Z',
  },
  {
    slug: 'interior-japandi',
    title: 'Interior Japandi',
    description:
      'Render de interiores minimalista no estilo Japandi: madeira clara, luz natural difusa e paleta neutra serena.',
    template: `Interior architecture render of a {{room}} in Japandi style.

Design: minimalist, warm light wood, {{materials}}, low furniture, clean negative space.
Light: soft diffused daylight from {{light_source}}, gentle shadows.
Palette: {{palette}}, calm and neutral.
Details: a few curated objects ({{accent}}), no clutter.
Camera: wide architectural lens, eye-level, straight verticals.

Technical: photoreal interior render, V-Ray quality, ultra detailed, no text, no watermark.`,
    negative:
      'cluttered, maximalist, bright saturated colors, plastic, baroque, fisheye distortion, text, watermark',
    inputs: [
      {
        key: 'room',
        label: 'Ambiente',
        type: 'enum',
        options: ['sala de estar', 'quarto', 'cozinha', 'home office'],
        value: 'sala de estar',
      },
      {
        key: 'materials',
        label: 'Materiais',
        type: 'text',
        value: 'linho, cerâmica fosca e pedra clara',
      },
      {
        key: 'light_source',
        label: 'Fonte de luz',
        type: 'enum',
        options: ['uma janela ampla', 'porta de vidro para o jardim', 'claraboia'],
        value: 'uma janela ampla',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'bege, off-white e madeira mel' },
      { key: 'accent', label: 'Detalhe', type: 'text', value: 'um vaso com galho seco e um livro' },
    ],
    models: ['Flux', 'Stable Diffusion', 'Midjourney'],
    difficulty: 'intermediate',
    category: 'Arquitetura',
    style_tags: ['arquitetura', 'interior', 'japandi', 'minimalismo'],
    cover_gradient: 'linear-gradient(135deg,#d9cfc2 0%,#b5a591 55%,#7c6a52 100%)',
    created_at: '2026-04-27T12:00:00Z',
  },
  {
    slug: 'editorial-moda-vogue',
    title: 'Editorial de Moda',
    description:
      'Foto de moda de alta-costura no estilo capa de revista, com pose escultural, luz dramática e styling avant-garde.',
    template: `High-fashion editorial photograph of {{model}}, {{pose}}, magazine cover energy.

Wardrobe: {{wardrobe}}, avant-garde styling, impeccable detail.
Set: {{set}}.
Light: {{lighting}}, sculpted shadows, glossy highlights.
Palette: {{palette}}.
Mood: {{mood}}, confident and editorial.
Camera: medium format, 80mm, shallow depth of field.

Technical: Vogue-grade, ultra detailed fabric texture, realistic skin, no text, no watermark.`,
    negative:
      'casual snapshot, low quality, distorted body, extra limbs, plastic skin, cluttered, text, watermark',
    inputs: [
      { key: 'model', label: 'Modelo', type: 'text', required: true, value: 'uma modelo andrógina de traços marcantes' },
      { key: 'pose', label: 'Pose', type: 'text', value: 'pose escultural com braço erguido' },
      {
        key: 'wardrobe',
        label: 'Figurino',
        type: 'text',
        value: 'um vestido estruturado em metal líquido',
      },
      {
        key: 'set',
        label: 'Cenário',
        type: 'enum',
        options: ['fundo infinito colorido', 'arquitetura brutalista', 'estúdio minimalista', 'duna no deserto'],
        value: 'fundo infinito colorido',
      },
      {
        key: 'lighting',
        label: 'Iluminação',
        type: 'enum',
        options: ['hard flash editorial', 'luz natural suave', 'gel colorido duplo', 'contraluz dramática'],
        value: 'gel colorido duplo',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'coral, prata e azul elétrico' },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['poderoso', 'enigmático', 'futurista', 'sensual'],
        value: 'futurista',
      },
    ],
    models: ['Midjourney', 'Flux', 'Stable Diffusion'],
    difficulty: 'advanced',
    category: 'Moda',
    style_tags: ['moda', 'editorial', 'alta-costura', 'vogue'],
    cover_gradient: 'linear-gradient(135deg,#1a0e1f 0%,#FF6B4A 50%,#22D3EE 100%)',
    created_at: '2026-04-30T12:00:00Z',
  },
  {
    slug: 'streetwear-lookbook',
    title: 'Streetwear Lookbook',
    description:
      'Fotografia de moda urbana estilo lookbook, com modelo na rua, luz natural e estética streetwear contemporânea.',
    template: `Streetwear lookbook photo of {{model}}, {{pose}}, on {{location}}.

Outfit: {{outfit}}, layered, contemporary street fashion.
Light: {{light}}, natural and candid.
Vibe: {{vibe}}, effortless cool.
Camera: 35mm, full body, slight motion energy.

Technical: editorial realism, crisp fabric detail, natural skin, no text, no watermark.`,
    negative:
      'studio formal, high fashion gown, distorted body, plastic skin, oversaturated, text, watermark',
    inputs: [
      { key: 'model', label: 'Modelo', type: 'text', value: 'um jovem de tranças e óculos vintage' },
      { key: 'pose', label: 'Pose', type: 'text', value: 'caminhando e olhando de lado' },
      { key: 'location', label: 'Local', type: 'text', value: 'uma esquina com grafite colorido' },
      {
        key: 'outfit',
        label: 'Look',
        type: 'text',
        value: 'jaqueta oversized, calça cargo e tênis chunky',
      },
      {
        key: 'light',
        label: 'Luz',
        type: 'enum',
        options: ['hora dourada', 'sombra suave do meio-dia', 'céu nublado difuso'],
        value: 'hora dourada',
      },
      {
        key: 'vibe',
        label: 'Vibe',
        type: 'enum',
        options: ['descolada', 'relaxada', 'confiante', 'nostálgica'],
        value: 'descolada',
      },
    ],
    models: ['Flux', 'Midjourney', 'Gemini'],
    difficulty: 'intermediate',
    category: 'Moda',
    style_tags: ['moda', 'streetwear', 'lookbook', 'urbano'],
    cover_gradient: 'linear-gradient(135deg,#2b1d12 0%,#FF6B4A 55%,#FFD27A 100%)',
    created_at: '2026-05-08T12:00:00Z',
  },
  {
    slug: 'hamburguer-gourmet-macro',
    title: 'Hambúrguer Gourmet Macro',
    description:
      'Foto publicitária de hambúrguer artesanal em close, com vapor, ingredientes frescos e iluminação apetitosa.',
    template: `Commercial macro food photograph of {{dish}}, hero shot.

Detail: {{detail}}, fresh ingredients, glossy textures, subtle steam rising.
Surface: {{surface}}.
Light: warm directional key light, soft fill, appetizing highlights.
Background: {{background}}, softly blurred.
Composition: 45-degree hero angle, shallow depth of field.

Technical: advertising quality, ultra sharp, mouth-watering, no text, no watermark.`,
    negative:
      'plastic food, cgi look, messy, dull colors, harsh flash, soggy, unappetizing, text, watermark',
    inputs: [
      { key: 'dish', label: 'Prato', type: 'text', value: 'um cheeseburger duplo artesanal' },
      {
        key: 'detail',
        label: 'Destaque',
        type: 'text',
        value: 'queijo derretendo, carne suculenta e pão brioche tostado',
      },
      { key: 'surface', label: 'Superfície', type: 'text', value: 'tábua de madeira rústica' },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['cozinha desfocada', 'preto dramático', 'madeira clara', 'tijolos rústicos'],
        value: 'cozinha desfocada',
      },
    ],
    models: ['Gemini', 'Flux', 'Midjourney'],
    difficulty: 'beginner',
    category: 'Comida',
    style_tags: ['comida', 'publicidade', 'macro', 'fast-food'],
    cover_gradient: 'linear-gradient(135deg,#2b1607 0%,#FF6B4A 55%,#FFC247 100%)',
    created_at: '2026-05-09T12:00:00Z',
  },
  {
    slug: 'retrato-pet-estudio',
    title: 'Retrato de Pet em Estúdio',
    description:
      'Retrato profissional de animal de estimação em estúdio, a partir de uma foto, com fundo colorido e luz suave.',
    template: `Studio portrait of {{pet}}, looking at the camera.

Use the reference photo to preserve the pet's breed, coloring and markings.
Background: {{background}}, solid seamless.
Light: soft beauty-dish key light, gentle fill, catchlights in the eyes.
Framing: {{framing}}, sharp focus on the eyes, fur detail.
Mood: {{mood}}, endearing.

Technical: photoreal, crisp fur texture, realistic, no text, no watermark.`,
    negative:
      'cartoon, distorted anatomy, extra legs, human features, blurry, messy background, text, watermark',
    inputs: [
      { key: 'pet', label: 'Pet', type: 'text', required: true, value: 'um cachorro corgi sorrindo' },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['coral vibrante', 'azul pastel', 'amarelo mostarda', 'cinza neutro'],
        value: 'coral vibrante',
      },
      {
        key: 'framing',
        label: 'Enquadramento',
        type: 'enum',
        options: ['close do rosto', 'busto', 'corpo inteiro'],
        value: 'close do rosto',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['alegre', 'majestoso', 'curioso', 'sonolento'],
        value: 'alegre',
      },
    ],
    models: ['Gemini', 'Flux', 'Midjourney'],
    difficulty: 'beginner',
    category: 'Animais',
    style_tags: ['animais', 'pet', 'retrato', 'estudio'],
    cover_gradient: 'linear-gradient(135deg,#FF6B4A 0%,#FFB199 55%,#FFE6DE 100%)',
    created_at: '2026-05-10T12:00:00Z',
  },
  {
    slug: 'vida-selvagem-natgeo',
    title: 'Vida Selvagem (NatGeo)',
    description:
      'Fotografia de vida selvagem estilo National Geographic, com teleobjetiva, hora dourada e momento decisivo.',
    template: `Award-winning wildlife photograph of {{animal}}, {{action}}, in {{habitat}}.

Moment: decisive, dynamic, telephoto compression.
Light: {{light}}, warm and natural, rim light separating subject from background.
Background: {{background}}, beautifully blurred bokeh.
Mood: {{mood}}, intimate and powerful.
Camera: 600mm f/4, eye-level, razor focus on the eye.

Technical: National Geographic quality, ultra detailed fur/feathers, photoreal, no text, no watermark.`,
    negative:
      'zoo enclosure, fences, cartoon, distorted anatomy, oversaturated, blurry subject, text, watermark',
    inputs: [
      { key: 'animal', label: 'Animal', type: 'text', required: true, value: 'uma onça-pintada' },
      { key: 'action', label: 'Ação', type: 'text', value: 'atravessando um rio com o olhar atento' },
      { key: 'habitat', label: 'Habitat', type: 'text', value: 'o Pantanal ao amanhecer' },
      {
        key: 'light',
        label: 'Luz',
        type: 'enum',
        options: ['hora dourada', 'névoa matinal', 'luz difusa de floresta', 'fim de tarde'],
        value: 'hora dourada',
      },
      {
        key: 'background',
        label: 'Fundo',
        type: 'text',
        value: 'vegetação ribeirinha e reflexo na água',
      },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['poderoso', 'sereno', 'tenso', 'majestoso'],
        value: 'poderoso',
      },
    ],
    models: ['Flux', 'Midjourney', 'Stable Diffusion'],
    difficulty: 'advanced',
    category: 'Animais',
    style_tags: ['animais', 'vida-selvagem', 'natgeo', 'fotografia'],
    cover_gradient: 'linear-gradient(135deg,#14210d 0%,#5c7a2f 55%,#FFD27A 100%)',
    created_at: '2026-04-14T12:00:00Z',
  },
  {
    slug: 'icone-app-3d',
    title: 'Ícone de App 3D',
    description:
      'Ícone de aplicativo em 3D com cantos arredondados, materiais glossy e iluminação de estúdio — pronto para a loja.',
    template: `3D app icon of {{symbol}}, modern squircle shape, centered on a {{background}} gradient.

Material: {{material}}, smooth bevels, soft glossy reflections.
Light: studio soft light, subtle ambient occlusion, gentle drop shadow.
Palette: {{palette}}.
Style: clean, friendly, premium, App Store ready, single icon only.

Technical: high resolution 3D render, no text, no extra elements, no watermark.`,
    negative:
      'photograph, cluttered, multiple icons, text labels, flat 2d, low resolution, harsh shadows, watermark',
    inputs: [
      { key: 'symbol', label: 'Símbolo', type: 'text', required: true, value: 'um foguete estilizado' },
      {
        key: 'material',
        label: 'Material',
        type: 'enum',
        options: ['vidro fosco', 'plástico glossy', 'metal escovado', 'gelatina translúcida'],
        value: 'plástico glossy',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'violeta para ciano' },
      {
        key: 'background',
        label: 'Fundo',
        type: 'enum',
        options: ['violeta-ciano', 'coral-amarelo', 'azul-escuro', 'verde-menta'],
        value: 'violeta-ciano',
      },
    ],
    models: ['DALL·E', 'Flux', 'Midjourney'],
    difficulty: 'beginner',
    category: 'Arte digital',
    style_tags: ['3d', 'icone', 'app', 'ui'],
    cover_gradient: 'linear-gradient(135deg,#7C3AED 0%,#22D3EE 100%)',
    created_at: '2026-05-11T12:00:00Z',
  },
  {
    slug: 'ilustracao-livro-infantil',
    title: 'Ilustração de Livro Infantil',
    description:
      'Ilustração fofa estilo livro infantil, com aquarela digital, cores quentes e personagem expressivo.',
    template: `Children's book illustration of {{character}}, {{action}}, in {{scene}}.

Style: soft digital watercolor, warm storybook palette, gentle textures, rounded shapes.
Mood: {{mood}}, cozy and whimsical.
Light: soft warm glow, friendly atmosphere.
Composition: clear focal character, simple readable background.

Technical: cohesive picture-book style, charming, no text, no watermark.`,
    negative:
      'photoreal, horror, dark gritty, complex realistic detail, scary, text, watermark, harsh contrast',
    inputs: [
      { key: 'character', label: 'Personagem', type: 'text', required: true, value: 'um ursinho astronauta' },
      { key: 'action', label: 'Ação', type: 'text', value: 'plantando uma flor em uma lua pequena' },
      { key: 'scene', label: 'Cena', type: 'text', value: 'um espaço estrelado aconchegante' },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['aconchegante', 'aventureiro', 'sonhador', 'divertido'],
        value: 'sonhador',
      },
    ],
    models: ['Midjourney', 'Flux', 'DALL·E'],
    difficulty: 'intermediate',
    category: 'Arte digital',
    style_tags: ['ilustracao', 'infantil', 'aquarela', 'storybook'],
    cover_gradient: 'linear-gradient(135deg,#1a1442 0%,#7C3AED 50%,#FFD27A 100%)',
    created_at: '2026-04-28T12:00:00Z',
  },
  {
    slug: 'pixel-art-isometrico',
    title: 'Pixel Art Isométrico',
    description:
      'Cena isométrica em pixel art detalhada, estilo jogo cozy, com paleta vibrante e iluminação suave.',
    template: `Detailed isometric pixel art of {{scene}}, cozy game art style.

View: clean isometric angle, crisp pixel grid, {{detail}}.
Palette: {{palette}}, harmonious and vibrant.
Light: soft directional light, subtle pixel shading, gentle glow.
Mood: {{mood}}, inviting diorama.

Technical: sharp pixel-perfect rendering, cohesive tile style, no text, no watermark.`,
    negative:
      'blurry, photoreal, smooth gradients, anti-aliased mush, 3d render, text, watermark',
    inputs: [
      { key: 'scene', label: 'Cena', type: 'text', required: true, value: 'uma cafeteria aconchegante de dois andares' },
      {
        key: 'detail',
        label: 'Detalhe',
        type: 'text',
        value: 'plantas, luzinhas e clientes minúsculos',
      },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'tons pastéis quentes com acentos turquesa' },
      {
        key: 'mood',
        label: 'Mood',
        type: 'enum',
        options: ['aconchegante', 'nostálgico', 'animado', 'tranquilo'],
        value: 'aconchegante',
      },
    ],
    models: ['Stable Diffusion', 'Flux', 'DALL·E'],
    difficulty: 'intermediate',
    category: 'Arte digital',
    style_tags: ['pixel-art', 'isometrico', 'game-art', 'cozy'],
    cover_gradient: 'linear-gradient(135deg,#15203b 0%,#7C3AED 55%,#34D399 100%)',
    created_at: '2026-04-24T12:00:00Z',
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

let out = `-- Seed: ${PROMPTYS.length} promptys + 1 demo author
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
  out += `INSERT INTO promptys (slug, title, description, author_id, template, negative, inputs_schema, models, difficulty, category, style_tags, cover_gradient, status, version, created_at)
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
  '${sqlEscape(p.category)}',
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
  category = EXCLUDED.category,
  style_tags = EXCLUDED.style_tags,
  cover_gradient = EXCLUDED.cover_gradient,
  updated_at = NOW();

`
}

const target = resolve(process.cwd(), 'supabase/seed.sql')
writeFileSync(target, out, 'utf8')
console.log(`Wrote ${PROMPTYS.length} promptys to ${target}`)
