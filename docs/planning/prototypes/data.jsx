// Mock data for Promptys prototype

const MOCK_USERS = [
  { id: 'u1', username: 'mira.vfx',     name: 'Mira Velasco',   avatar: '#7C3AED', level: 5, points: 6420 },
  { id: 'u2', username: 'tucano',       name: 'Caio Tucano',    avatar: '#22D3EE', level: 4, points: 2180 },
  { id: 'u3', username: 'nova.studio',  name: 'Nova Studio',    avatar: '#FF6B4A', level: 6, points: 12340 },
  { id: 'u4', username: 'ana.pixels',   name: 'Ana Sato',       avatar: '#34D399', level: 3, points: 980 },
  { id: 'u5', username: 'bru.lab',      name: 'Bruno Lab',      avatar: '#F59E0B', level: 5, points: 5210 },
  { id: 'u6', username: 'lia.frames',   name: 'Lia Mota',       avatar: '#EC4899', level: 4, points: 3120 },
  { id: 'u_me', username: 'voce',       name: 'Você',           avatar: '#7C3AED', level: 2, points: 240 },
];

// "image" is just a gradient string we use as a placeholder where image-slot isn't present
const MOCK_PROMPTYS = [
  {
    id: 'p1',
    slug: 'retrato-cinematografico',
    title: 'Retrato Cinematográfico',
    description: 'Retrato editorial premium com foto de referência opcional. Mantém traços do sujeito, aplica direção de luz cinematográfica e grading de cor refinado.',
    author: 'u1',
    cover: 'linear-gradient(135deg,#3b1d6e 0%,#7C3AED 50%,#FF6B4A 100%)',
    coverAccent: '#7C3AED',
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
    negative: 'low quality, blurry, distorted face, extra fingers, bad hands, broken anatomy, duplicate body parts, text, watermark, logo, plastic skin, uncanny valley',
    inputs: [
      { key: 'subject_description', label: 'Personagem', type: 'text', required: true, placeholder: 'uma guerreira futurista, um chef em ação...', value: 'uma astrônoma de cabelo curto, olhar concentrado' },
      { key: 'reference_image', label: 'Foto de referência', type: 'image', required: false },
      { key: 'environment', label: 'Ambiente', type: 'text', value: 'um observatório à meia-noite' },
      { key: 'wardrobe', label: 'Figurino', type: 'text', value: 'jaleco preto técnico' },
      { key: 'pose', label: 'Pose', type: 'text', value: 'olhando para o telescópio, perfil 3/4' },
      { key: 'visual_style', label: 'Estilo visual', type: 'enum', options: ['cinematic realism', 'editorial fashion', 'dark fantasy', 'anime detailed', '3D render', 'surreal photography'], value: 'cinematic realism' },
      { key: 'lighting_style', label: 'Iluminação', type: 'enum', options: ['softbox lighting', 'golden hour', 'neon rim light', 'dramatic chiaroscuro', 'overcast natural light'], value: 'neon rim light' },
      { key: 'camera_style', label: 'Câmera', type: 'enum', options: ['Arri Alexa', 'Sony A7R IV', 'Hasselblad H6D', 'RED Komodo'], value: 'Arri Alexa' },
      { key: 'lens', label: 'Lente', type: 'enum', options: ['35mm f/1.4', '50mm f/1.2', '85mm f/1.4', '105mm macro'], value: '85mm f/1.4' },
      { key: 'mood', label: 'Mood', type: 'enum', options: ['contemplativo', 'tenso', 'sereno', 'épico', 'íntimo'], value: 'contemplativo' },
      { key: 'color_palette', label: 'Paleta', type: 'text', value: 'tons de azul-meia-noite, violeta e cobre' },
      { key: 'composition', label: 'Composição', type: 'enum', options: ['rule of thirds', 'centered close-up', 'leading lines', 'symmetric'], value: 'rule of thirds' },
      { key: 'aspect_ratio', label: 'Proporção', type: 'enum', options: ['1:1', '4:5', '9:16', '16:9'], value: '4:5' },
      { key: 'chaos', label: 'Variação criativa', type: 'number', min: 0, max: 100, value: 20 },
    ],
    models: ['Midjourney', 'Flux', 'SDXL'],
    difficulty: 'intermediate',
    styleTags: ['retrato', 'cinematográfico', 'editorial'],
    license: 'community-remix',
    version: 4,
    createdAt: '2026-04-21',
    stats: { tests: 412, likes: 1840, saves: 612, remixes: 38, ratingAvg: 4.7, ratingCount: 287 },
    ratingsBreakdown: { visual_quality: 4.8, prompt_accuracy: 4.6, reproducibility: 4.5, originality: 4.7, model_compat: 4.4 },
  },
  {
    id: 'p2',
    slug: 'cartaz-editorial-y2k',
    title: 'Cartaz Editorial Y2K',
    description: 'Cartaz tipográfico inspirado em revistas dos anos 2000, com tipografia agressiva, cores saturadas e textura de impressão.',
    author: 'u3',
    cover: 'linear-gradient(135deg,#FF6B4A 0%,#FFCC00 60%,#22D3EE 100%)',
    coverAccent: '#FF6B4A',
    template: `Editorial Y2K magazine cover poster featuring {{subject}}, dominant headline reading "{{headline}}".

Layout: {{layout_style}}, oversized typography, cluttered editorial energy, scanned print texture, slight chromatic aberration.

Color palette: {{palette}}.
Subject treatment: {{treatment}}, high-contrast lighting.

Decoration: small chrome stickers, holographic stars, callouts in tiny serif type.
Quality: 4k, sharp print scan look, paper grain, no real brand logos.`,
    negative: 'modern minimal flat design, swiss style, dull colors, vector clean, generic stock photo, blurry text',
    inputs: [
      { key: 'subject', label: 'Sujeito', type: 'text', value: 'patinadora com fones grandes' },
      { key: 'headline', label: 'Headline', type: 'text', value: 'FUTURE NOW' },
      { key: 'layout_style', label: 'Layout', type: 'enum', options: ['asymmetric', 'centered chaos', 'grid-broken', 'all-caps stack'], value: 'centered chaos' },
      { key: 'palette', label: 'Paleta', type: 'text', value: 'magenta, ciano elétrico, prata cromado' },
      { key: 'treatment', label: 'Tratamento', type: 'enum', options: ['flash photo', 'studio lit', 'lo-fi disposable cam'], value: 'flash photo' },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    styleTags: ['poster', 'y2k', 'editorial', 'tipografia'],
    license: 'community-remix',
    version: 2,
    createdAt: '2026-05-01',
    stats: { tests: 188, likes: 920, saves: 410, remixes: 22, ratingAvg: 4.5, ratingCount: 96 },
    ratingsBreakdown: { visual_quality: 4.7, prompt_accuracy: 4.4, reproducibility: 4.6, originality: 4.8, model_compat: 4.2 },
  },
  {
    id: 'p3',
    slug: 'arquitetura-brutalismo',
    title: 'Brutalismo Solar',
    description: 'Renderização arquitetônica de inspiração brutalista, banhada por luz quente e sombras longas.',
    author: 'u5',
    cover: 'linear-gradient(135deg,#1f1d1a 0%,#FF6B4A 70%,#FFCC88 100%)',
    coverAccent: '#FF6B4A',
    template: `Architectural render of a brutalist building, {{building_type}}, located in {{context}}.

Materials: raw concrete, exposed aggregate, bronze accents.
Lighting: {{light_time}}, long shadows, warm ambient bounce.
Atmosphere: {{atmosphere}}.
Camera: {{camera}}, architectural composition, vertical lines preserved.

High detail, photoreal render, no people unless specified.`,
    negative: 'cartoon, watercolor, generic glass skyscraper, futuristic neon, lens distortion',
    inputs: [
      { key: 'building_type', label: 'Tipologia', type: 'text', value: 'biblioteca municipal' },
      { key: 'context', label: 'Contexto', type: 'text', value: 'morro arborizado em São Paulo' },
      { key: 'light_time', label: 'Luz', type: 'enum', options: ['golden hour', 'high noon', 'overcast', 'blue hour'], value: 'golden hour' },
      { key: 'atmosphere', label: 'Atmosfera', type: 'enum', options: ['poeira no ar', 'após chuva', 'limpa e seca', 'névoa baixa'], value: 'poeira no ar' },
      { key: 'camera', label: 'Câmera', type: 'enum', options: ['tilt-shift', '24mm wide', '50mm normal'], value: '24mm wide' },
    ],
    models: ['Flux', 'SDXL', 'DALL-E'],
    difficulty: 'advanced',
    styleTags: ['arquitetura', 'brutalismo', 'render'],
    license: 'community-remix',
    version: 3,
    createdAt: '2026-04-12',
    stats: { tests: 256, likes: 1120, saves: 380, remixes: 14, ratingAvg: 4.8, ratingCount: 142 },
    ratingsBreakdown: { visual_quality: 4.9, prompt_accuracy: 4.7, reproducibility: 4.6, originality: 4.5, model_compat: 4.7 },
  },
  {
    id: 'p4',
    slug: 'mascote-claymation',
    title: 'Mascote Claymation',
    description: 'Personagem em estilo stop-motion de massa de modelar, com câmera fofa e iluminação macro.',
    author: 'u6',
    cover: 'linear-gradient(135deg,#34D399 0%,#22D3EE 60%,#7C3AED 100%)',
    coverAccent: '#34D399',
    template: `Claymation stop-motion character of {{character}}, in {{pose}}, on {{set}}.

Material: visible plasticine fingerprints, soft uneven surfaces.
Lighting: macro studio softbox, gentle bounce.
Lens: macro, shallow depth of field, slight vignette.
Mood: {{mood}}, charming, handcrafted.

Render quality: photographic, NOT 3d cgi, NOT cartoon.`,
    negative: 'pixar 3d render, vector illustration, smooth digital surfaces, photoreal human',
    inputs: [
      { key: 'character', label: 'Personagem', type: 'text', value: 'um capivara de cachecol' },
      { key: 'pose', label: 'Pose', type: 'text', value: 'segurando um chimarrão' },
      { key: 'set', label: 'Cenário', type: 'text', value: 'mini-cozinha com azulejo verde' },
      { key: 'mood', label: 'Mood', type: 'enum', options: ['acolhedor', 'travesso', 'contemplativo', 'bobo'], value: 'acolhedor' },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    styleTags: ['personagem', 'stop-motion', 'claymation'],
    license: 'community-remix',
    version: 1,
    createdAt: '2026-05-03',
    stats: { tests: 92, likes: 540, saves: 198, remixes: 6, ratingAvg: 4.6, ratingCount: 41 },
    ratingsBreakdown: { visual_quality: 4.8, prompt_accuracy: 4.5, reproducibility: 4.7, originality: 4.6, model_compat: 4.3 },
  },
  {
    id: 'p5',
    slug: 'logo-monograma',
    title: 'Monograma Geométrico',
    description: 'Logo monogramático geométrico, vetorial, ideal para marcas premium.',
    author: 'u2',
    cover: 'linear-gradient(135deg,#0c1120 0%,#22D3EE 100%)',
    coverAccent: '#22D3EE',
    template: `Vector monogram logo of letters "{{letters}}", {{style}}, {{weight}} strokes, perfectly geometric, golden ratio proportions.

Background: pure white. Single color: {{color}}.
No text labels, no taglines, single mark only.
Style: premium, scalable, suitable for app icon.`,
    negative: 'photograph, gradient mesh, 3d, cluttered, multiple marks, text labels, low resolution',
    inputs: [
      { key: 'letters', label: 'Letras', type: 'text', value: 'PR' },
      { key: 'style', label: 'Estilo', type: 'enum', options: ['serif sharp', 'sans rounded', 'monospaced', 'art deco'], value: 'sans rounded' },
      { key: 'weight', label: 'Peso', type: 'enum', options: ['thin', 'medium', 'bold'], value: 'medium' },
      { key: 'color', label: 'Cor', type: 'text', value: '#7C3AED' },
    ],
    models: ['Flux', 'SDXL', 'DALL-E'],
    difficulty: 'intermediate',
    styleTags: ['logo', 'vetorial', 'branding'],
    license: 'community-remix',
    version: 2,
    createdAt: '2026-04-29',
    stats: { tests: 134, likes: 720, saves: 290, remixes: 18, ratingAvg: 4.4, ratingCount: 78 },
    ratingsBreakdown: { visual_quality: 4.5, prompt_accuracy: 4.3, reproducibility: 4.7, originality: 4.1, model_compat: 4.5 },
  },
  {
    id: 'p6',
    slug: 'still-comida',
    title: 'Still de Comida 35mm',
    description: 'Fotografia de comida estilo editorial gastronômico, em filme 35mm, com mãos no enquadramento.',
    author: 'u4',
    cover: 'linear-gradient(135deg,#3a1f0d 0%,#FF6B4A 50%,#FFE6B0 100%)',
    coverAccent: '#FF6B4A',
    template: `Food still life of {{dish}}, on {{surface}}, hands gently arranging it.

Film stock: Kodak Portra 400, slight grain.
Lens: 50mm f/1.8.
Lighting: window side-light, soft shadows, warm temperature.
Composition: top-down 3/4 angle, negative space.
Styling: organic, imperfect, restaurant-grade plating.`,
    negative: 'plastic-looking food, cgi, oversaturated, harsh ring flash, stock photography',
    inputs: [
      { key: 'dish', label: 'Prato', type: 'text', value: 'moqueca de palmito com farofa' },
      { key: 'surface', label: 'Superfície', type: 'text', value: 'mesa de barro envelhecida' },
    ],
    models: ['Midjourney', 'Flux'],
    difficulty: 'beginner',
    styleTags: ['comida', 'still-life', 'fotografia'],
    license: 'community-remix',
    version: 1,
    createdAt: '2026-05-04',
    stats: { tests: 67, likes: 380, saves: 142, remixes: 4, ratingAvg: 4.7, ratingCount: 32 },
    ratingsBreakdown: { visual_quality: 4.8, prompt_accuracy: 4.6, reproducibility: 4.7, originality: 4.4, model_compat: 4.3 },
  },
];

const MOCK_TESTS = [
  { id: 't1', promptyId: 'p1', userId: 'u2', model: 'Midjourney', rating: 5, notes: 'Funcionou ótimo com referência de retrato 3/4. Cabelo ficou consistente.', cover: 'linear-gradient(135deg,#1c0f3a,#7C3AED,#FF6B4A)', daysAgo: 1 },
  { id: 't2', promptyId: 'p1', userId: 'u4', model: 'Flux',       rating: 4, notes: 'Cores um pouco saturadas demais com chaos > 30. Reduzi para 15.', cover: 'linear-gradient(135deg,#1f2240,#22D3EE,#7C3AED)', daysAgo: 2 },
  { id: 't3', promptyId: 'p1', userId: 'u5', model: 'SDXL',       rating: 4, notes: 'Precisei adicionar weight extra na pose pra não virar de frente.', cover: 'linear-gradient(135deg,#2a1d3d,#7C3AED,#22D3EE)', daysAgo: 3 },
  { id: 't4', promptyId: 'p1', userId: 'u6', model: 'Midjourney', rating: 5, notes: 'Perfeito para a campanha do observatório. Salvando como base.', cover: 'linear-gradient(135deg,#0e1a3a,#22D3EE,#FF6B4A)', daysAgo: 5 },
  { id: 't5', promptyId: 'p1', userId: 'u3', model: 'Flux',       rating: 5, notes: 'Reproducibilidade incrível mesmo trocando lente. Recomendo.', cover: 'linear-gradient(135deg,#3a1505,#FF6B4A,#FFCC88)', daysAgo: 6 },
  { id: 't6', promptyId: 'p1', userId: 'u2', model: 'DALL-E',     rating: 3, notes: 'Em DALL-E perde a textura cinematográfica. Melhor em MJ.',         cover: 'linear-gradient(135deg,#21183a,#7C3AED,#34D399)', daysAgo: 8 },
];

const MOCK_REMIXES = [
  { id: 'r1', originalId: 'p1', remixId: 'p1r1', title: 'Retrato Cinematográfico — Mood Noir', author: 'u3', daysAgo: 4, cover: 'linear-gradient(135deg,#000,#1a1530,#7C3AED)' },
  { id: 'r2', originalId: 'p1', remixId: 'p1r2', title: 'Retrato Cinematográfico — Solar Editorial', author: 'u5', daysAgo: 9, cover: 'linear-gradient(135deg,#3a1505,#FF6B4A,#FFCC88)' },
  { id: 'r3', originalId: 'p1', remixId: 'p1r3', title: 'Retrato Cinematográfico — Anime Highlight', author: 'u6', daysAgo: 14, cover: 'linear-gradient(135deg,#1d0e3a,#22D3EE,#FF6B4A)' },
];

const MOCK_COMMENTS = [
  { id: 'c1', userId: 'u4', daysAgo: 1, text: 'Obrigada por incluir o slot de imagem de referência. Tô usando pra preservar consistência entre frames.', helpful: 12 },
  { id: 'c2', userId: 'u5', daysAgo: 2, text: 'Dica: se diminuir o chaos pra 10–15 funciona melhor com Flux schnell.', helpful: 28 },
  { id: 'c3', userId: 'u2', daysAgo: 4, text: 'Adoraria uma versão com lente anamórfica como preset.', helpful: 6 },
];

const BADGES = [
  { key: 'crafter',     name: 'Prompt Crafter',    desc: 'Publicou seu primeiro Prompty', icon: '✦', color: '#7C3AED', earned: true,  progress: 1 },
  { key: 'tester',      name: 'Visual Tester',     desc: 'Testou 25 promptys da comunidade', icon: '◐', color: '#22D3EE', earned: true,  progress: 1 },
  { key: 'reviewer',    name: 'Sharp Reviewer',    desc: '20 avaliações marcadas como úteis', icon: '★', color: '#FF6B4A', earned: false, progress: 0.4 },
  { key: 'remix',       name: 'Remix Alchemist',   desc: '10 remixes aceitos pela comunidade', icon: '⟳', color: '#34D399', earned: false, progress: 0.2 },
  { key: 'style',       name: 'Style Architect',   desc: 'Promptys com excelente consistência', icon: '◆', color: '#7C3AED', earned: false, progress: 0.0 },
  { key: 'spark',       name: 'Community Spark',   desc: 'Comentários úteis e construtivos', icon: '✸', color: '#FF6B4A', earned: true,  progress: 1 },
  { key: 'whisperer',   name: 'Model Whisperer',   desc: 'Promptys que funcionam em 4+ modelos', icon: '◈', color: '#22D3EE', earned: false, progress: 0.6 },
  { key: 'hall',        name: 'Hall of Promptys',  desc: 'Top contribuidor do mês', icon: '♔', color: '#FFCC00', earned: false, progress: 0 },
];

const LEVELS = [
  { n: 1, name: 'Curioso Visual',    pts: 0 },
  { n: 2, name: 'Aprendiz de Prompt',pts: 100 },
  { n: 3, name: 'Prompt Crafter',    pts: 500 },
  { n: 4, name: 'Remix Alchemist',   pts: 1500 },
  { n: 5, name: 'Style Architect',   pts: 5000 },
  { n: 6, name: 'Model Whisperer',   pts: 10000 },
  { n: 7, name: 'Hall of Promptys',  pts: 25000 },
];

const FEED_TABS = [
  { key: 'trending', label: 'Em alta' },
  { key: 'new',      label: 'Novos' },
  { key: 'tested',   label: 'Mais testados' },
  { key: 'top',      label: 'Melhor avaliados' },
  { key: 'remix',    label: 'Remixáveis' },
  { key: 'easy',     label: 'Iniciantes' },
];

const ACTIVITY = [
  { id: 'a1', type: 'remix',  text: 'remixou seu Prompty Retrato Cinematográfico',  user: 'u3', daysAgo: 1, points: '+25' },
  { id: 'a2', type: 'rating', text: 'avaliou seu Prompty com 5 estrelas',           user: 'u4', daysAgo: 1, points: null },
  { id: 'a3', type: 'badge',  text: 'desbloqueou Community Spark',                  user: 'u_me', daysAgo: 2, points: '+10' },
  { id: 'a4', type: 'test',   text: 'testou Cartaz Editorial Y2K',                  user: 'u_me', daysAgo: 3, points: '+15' },
  { id: 'a5', type: 'comment', text: 'comentou em Brutalismo Solar',                user: 'u5', daysAgo: 4, points: null },
];

Object.assign(window, {
  MOCK_USERS, MOCK_PROMPTYS, MOCK_TESTS, MOCK_REMIXES, MOCK_COMMENTS,
  BADGES, LEVELS, FEED_TABS, ACTIVITY,
});
