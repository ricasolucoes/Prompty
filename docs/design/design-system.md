# Design System

---

## Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| Midnight Ink | `#090A14` | Background principal |
| Electric Violet | `#7C3AED` | Primary / nível L2 / logo |
| Prompt Cyan | `#22D3EE` | Accent / nível L1 |
| Solar Coral | `#FF6B4A` | CTA destaque / nível L3 / warnings |
| Mint Signal | `#34D399` | Sucesso / confirmações |
| Amber | `#FFB020` | Estrelas / nível L4 |
| Pink | `#EC4899` | Streak / badges premium / nível L5 |

### CSS Variables (inferidas do protótipo)

```css
--bg: #090A14;
--surface: /* card background */
--surface-2: /* fundo de input e seções */
--text-1: /* texto principal */
--text-2: /* texto secundário */
--text-3: /* texto terciário / placeholders */
--line: /* bordas suaves */
--primary: #7C3AED;
--primary-soft: rgba(124,58,237,0.12);
--chip-bg: /* fundo de chips */
--chip-bd: /* borda de chips */
--card-bg: /* fundo de cards */
--header-bg: /* fundo do header com blur */
--input-bg: /* fundo de inputs */
```

---

## Tipografia

| Font | Uso | CDN |
|------|-----|-----|
| Space Grotesk | Logo, headings, números de pontos, nomes de nível | Google Fonts |
| Inter | UI geral (corpo, labels, botões) | Google Fonts |
| JetBrains Mono | Blocos de prompt, código, contadores de progresso | Google Fonts |

### Escala tipográfica (referência do protótipo)

| Elemento | Size | Weight | Font |
|----------|------|--------|------|
| App title | 22px | 700 | Space Grotesk |
| Card title | 26px | 800 | Space Grotesk |
| Level name | 19–30px | 800 | Space Grotesk |
| Points number | 16–17px | 800 | Space Grotesk |
| Body | 13–14px | 400–600 | Inter |
| Label | 11–12px | 700 | Inter |
| Chip / badge | 11–12px | 700–800 | Inter / Space Grotesk |
| Prompt text | 13px | 400 | JetBrains Mono |
| Monospace counter | 11px | 400 | ui-monospace |

---

## Componentes de UI (`ui.jsx`)

### Icon

Ícones SVG inline monoline (stroke, 24px viewport). Parâmetros: `name`, `size`, `color`, `strokeWidth`.

Ícones disponíveis: `home, search, plus, crown, user, heart, heartFill, bookmark, bookmarkFill, remix, sparkle, star, starFill, chevronR, chevronL, chevronD, check, x, flag, image, send, copy, play, settings, bell, flame, trophy, code, menu, arrow, edit, eye, trash, message, lightning, wand, lock`

### Avatar

Círculo com gradiente + iniciais. Props: `user`, `size`, `ring` (borda de destaque).

### Chip / Tag

```
tone: neutral | violet | cyan | coral | mint | solid | dark
size: xs | sm | md
```

### Button

```
variant: primary | secondary | ghost
size: sm | md | lg
icon: (nome do Icon)
full: boolean (width 100%)
```

### Progress Bar

```
value, max, color (gradient string), height
```

---

## Border Radius

| Elemento | Radius |
|----------|--------|
| Cards | 20px |
| Botões / chips pequenos | 8–14px |
| Chips pill | 999px |
| Inputs | 10–14px |
| Modal | 24px |
| Abas de perfil | 12px |

---

## Sombras e Efeitos

- Header: `backdrop-filter: blur(20px) saturate(180%)`
- Streak flame: `box-shadow: 0 2px 8px rgba(255,107,74,0.35)`
- Cards flutuantes: `box-shadow: 0 2px 6px rgba(0,0,0,0.06)`
- Animações: `pop` (modal level-up, cubic-bezier(.2,1.4,.4,1)), `fadeIn` (overlay)

---

## Logo

SVG inline. Elementos:
- Retângulo arredondado com gradiente `#7C3AED → #22D3EE`
- Linhas de "prompt" (horizontais com `…` visual)
- Círculo `#22D3EE` no canto superior direito com sparkle branco

---

## Chips de Modelo

Chips compactos para Midjourney, Flux, SDXL, DALL-E. Exibidos no card e na tela de detalhe. Máximo 4 visíveis; excedente indicado por `+N`.

## Chips de Dificuldade

| Valor | Cor | Label |
|-------|-----|-------|
| beginner | `#34D399` | Iniciante |
| intermediate | `#FFB020` | Intermediário |
| advanced | `#FF6B4A` | Avançado |
