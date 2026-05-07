# Prompty — Entidade e Sistema de Templates

O Prompty é a unidade central do produto: um template parametrizável com variáveis, imagens de referência, negative prompts, configurações de modelo, exemplos de saída, histórico de versões e avaliações.

---

## Campos do Prompty

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | Identificador único |
| `slug` | string | URL-friendly, ex: `retrato-cinematografico` |
| `title` | string | Título curto e descritivo |
| `description` | string | O que o prompty gera, em 2 frases |
| `author` | string (userId) | Criador do prompty |
| `cover` | string (gradient/url) | Imagem de capa para o feed |
| `coverAccent` | string (hex) | Cor de destaque extraída da capa |
| `template` | string | Texto do prompt com variáveis `{{key}}` |
| `negative` | string | Negative prompt (parâmetros a evitar) |
| `inputs` | Input[] | Definição das variáveis editáveis |
| `models` | string[] | Modelos compatíveis testados |
| `difficulty` | `beginner` \| `intermediate` \| `advanced` | Dificuldade de uso |
| `styleTags` | string[] | Tags de estilo/categoria |
| `license` | `community-remix` | Licença (só community-remix no MVP) |
| `version` | number | Versão atual do template |
| `createdAt` | string (date) | Data de criação |
| `stats` | Stats | Contadores agregados |
| `ratingsBreakdown` | RatingsBreakdown | Médias por dimensão |

---

## Sintaxe de Template

Variáveis usam double-curly-brace: `{{nome_da_variavel}}`

```
Create a cinematic portrait of {{subject_description}}.
Lighting: {{lighting_style}}, shot on {{camera_style}}.
```

### Regras de implementação

- Fonte única de parse/render: `src/lib/prompty/template.ts`
- Substituição: `replaceAll(`{{${input.key}}}`, value || `[${input.label}]`)`
- Se variável não preenchida, usa valor padrão (`input.value`); se sem padrão, usa `[Label]`
- Nunca duplicar lógica de detecção de variáveis em componentes de UI

---

## Tipos de Input (inputs_schema)

| Tipo | Renderização | Exemplo |
|------|-------------|---------|
| `text` | Input livre | "uma astrônoma de cabelo curto" |
| `image` | Upload / image-slot | Foto de referência |
| `enum` | Seletor de opções | `['cinematic realism', 'editorial fashion', ...]` |
| `number` | Slider com min/max | Variação criativa: 0–100 |
| `boolean` | Toggle | — |
| `color` | Color picker | `#7C3AED` |
| `ratio` | Seletor de aspect ratio | `['1:1', '4:5', '9:16', '16:9']` |
| `seed` | Número de seed | — |

### Schema de um Input

```typescript
interface Input {
  key: string         // nome da variável no template
  label: string       // label amigável exibida no UI
  type: InputType
  required?: boolean
  placeholder?: string
  value?: string      // valor padrão
  options?: string[]  // apenas para type === 'enum'
  min?: number        // apenas para type === 'number'
  max?: number
}
```

---

## Stats do Prompty

```typescript
interface Stats {
  tests: number       // quantas vezes foi testado com imagem
  likes: number       // curtidas totais
  saves: number       // vezes salvo na biblioteca
  remixes: number     // remixes criados a partir dele
  ratingAvg: number   // média geral (1–5)
  ratingCount: number // total de avaliações
}
```

---

## Avaliação Multi-dimensional (L2+)

```typescript
interface RatingsBreakdown {
  visual_quality: number    // qualidade visual gerada
  prompt_accuracy: number   // prompt faz o que promete?
  reproducibility: number   // consistência entre gerações
  originality: number       // originalidade do conceito
  model_compat: number      // compatibilidade com múltiplos modelos
}
```

L1 usa apenas 1 dimensão: "Funcionou bem?" (1–5 estrelas).

---

## Remix

Um remix é um prompty derivado de outro, mantendo crédito ao original.

```typescript
interface Remix {
  id: string
  originalId: string    // prompty de origem
  remixId: string       // novo prompty criado
  title: string
  author: string        // quem fez o remix
  daysAgo: number
  cover: string
}
```

Licença padrão no MVP: `community-remix` — permite remixes com crédito obrigatório.

---

## Dificuldade

| Valor | Exibição | Cor |
|-------|---------|-----|
| `beginner` | Iniciante | Verde (`#34D399`) |
| `intermediate` | Intermediário | Amarelo (`#FFB020`) |
| `advanced` | Avançado | Coral (`#FF6B4A`) |

---

## Modelos Compatíveis

Chips de modelo exibidos no card e na tela de detalhe. Exemplos em uso nos mocks:
- Midjourney
- Flux
- SDXL
- DALL-E

A lista de modelos é string[] livre, sem enum fixo no MVP.

---

## Fluxo de Criação (L3) — 3 passos

1. **Inspiração** — título, descrição, categoria, capa
2. **Prompt** — template completo (textarea monospace) + dica de boas práticas
3. **Publicar** — resumo + confirmação (+50p na publicação)

Prompt entra em "Em alta" por 24h após publicação.
