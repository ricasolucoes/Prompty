# Modelo de Dados

Tabelas principais do Supabase. RLS obrigatório em todas. Fonte: `PROJECT.md` + `data.jsx`.

---

## Tabelas Principais

### `profiles`

Extensão de `auth.users`. Criada via trigger no signup.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid (FK auth.users) | |
| `username` | text UNIQUE | Handle público (@handle) |
| `name` | text | Nome de exibição |
| `avatar_url` | text | URL da imagem de perfil |
| `level` | text | Nível atual: `L1` / `L2` / `L3` / `L4` / `L5` |
| `points` | int | Total de pontos (derivado de point_events) |
| `streak` | int | Dias consecutivos de login |
| `verified` | boolean | Usuário verificado (L4+) |
| `created_at` | timestamptz | |

### `promptys`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `slug` | text UNIQUE | URL-friendly |
| `title` | text | |
| `description` | text | |
| `author_id` | uuid (FK profiles) | |
| `template` | text | Texto com `{{variavel}}` |
| `negative` | text | Negative prompt |
| `inputs_schema` | jsonb | Array de Input objects |
| `models` | text[] | Modelos compatíveis |
| `difficulty` | text | `beginner/intermediate/advanced` |
| `style_tags` | text[] | Tags |
| `license` | text | `community-remix` |
| `status` | text | `draft/published/removed` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `prompty_versions`

Histórico imutável de versões.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `prompty_id` | uuid (FK promptys) | |
| `version` | int | Número da versão |
| `template` | text | Snapshot do template |
| `inputs_schema` | jsonb | Snapshot dos inputs |
| `created_at` | timestamptz | |
| `created_by` | uuid (FK profiles) | |

### `prompty_tests`

Registro de uso real com imagem resultado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `prompty_id` | uuid | |
| `user_id` | uuid | |
| `model` | text | Modelo usado |
| `rating` | int | 1–5 |
| `notes` | text | Observações |
| `image_url` | text | Imagem gerada (Storage) |
| `created_at` | timestamptz | |

### `prompty_ratings`

Avaliação multi-dimensional (L2+).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `prompty_id` | uuid | |
| `user_id` | uuid | |
| `visual_quality` | numeric(3,2) | 1–5 |
| `prompt_accuracy` | numeric(3,2) | 1–5 |
| `reproducibility` | numeric(3,2) | 1–5 |
| `originality` | numeric(3,2) | 1–5 |
| `model_compat` | numeric(3,2) | 1–5 |
| `helpful_count` | int | Marcações de "útil" |
| `created_at` | timestamptz | |

UNIQUE: `(prompty_id, user_id)`

### `prompty_likes`

| Campo | Tipo |
|-------|------|
| `user_id` | uuid |
| `prompty_id` | uuid |
| `created_at` | timestamptz |

PK: `(user_id, prompty_id)`

### `prompty_saves`

| Campo | Tipo |
|-------|------|
| `user_id` | uuid |
| `prompty_id` | uuid |
| `created_at` | timestamptz |

PK: `(user_id, prompty_id)`

### `prompty_remixes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `original_id` | uuid (FK promptys) | Prompty de origem |
| `remix_id` | uuid (FK promptys) | Novo prompty criado |
| `created_at` | timestamptz | |

### `point_events` (imutável)

**Nunca inserir diretamente do frontend.** Alimentado por triggers SQL.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | |
| `user_id` | uuid | |
| `event_type` | text | `copy/rate/like/streak/publish/remix_accepted` |
| `points` | int | Valor positivo |
| `ref_id` | uuid | ID do recurso relacionado |
| `created_at` | timestamptz | |

---

## Mock Data (Protótipo)

Usuários mockados em `data.jsx`:

| Handle | Nome | Nível | Pontos |
|--------|------|-------|--------|
| mira.vfx | Mira Velasco | 5 | 6.420 |
| tucano | Caio Tucano | 4 | 2.180 |
| nova.studio | Nova Studio | 6 | 12.340 |
| ana.pixels | Ana Sato | 3 | 980 |
| bru.lab | Bruno Lab | 5 | 5.210 |
| lia.frames | Lia Mota | 4 | 3.120 |
| voce | Você | 2 | 240 |

Promptys mockados (6 exemplos):

| ID | Título | Dificuldade | Modelos |
|----|--------|-------------|---------|
| p1 | Retrato Cinematográfico | intermediate | MJ, Flux, SDXL |
| p2 | Cartaz Editorial Y2K | beginner | MJ, Flux |
| p3 | Brutalismo Solar | advanced | Flux, SDXL, DALL-E |
| p4 | Mascote Claymation | beginner | MJ, Flux |
| p5 | Monograma Geométrico | intermediate | Flux, SDXL, DALL-E |
| p6 | Still de Comida 35mm | beginner | MJ, Flux |

---

## RLS — Regras de Acesso

| Tabela | Select | Insert | Update | Delete |
|--------|--------|--------|--------|--------|
| profiles | todos | próprio | próprio | — |
| promptys | todos (published) | autenticado | autor | autor |
| prompty_versions | todos | sistema | — | — |
| prompty_tests | todos | autenticado | autor | — |
| prompty_ratings | todos | autenticado (1 por prompty) | autor | — |
| prompty_likes | todos | autenticado | — | autor |
| prompty_saves | próprio | autenticado | — | autor |
| prompty_remixes | todos | autenticado (L3) | — | — |
| point_events | próprio | **apenas triggers** | — | — |

Mutations do frontend vão direto via `supabase-js` (com RLS protegendo); features nativas (share, notificações, keychain) via Tauri commands.
