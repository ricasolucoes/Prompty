# Protótipo V1 — Promptys.html

Arquivo: `docs/planning/prototypes/Promptys.html`

Este é o protótipo completo (Advanced / L3), com todos os recursos do produto implementados em React inline + Babel. Serve como referência definitiva de comportamento, visual e fluxos para o MVP.

---

## Estrutura do Arquivo

```
Promptys.html
├── CSS global (tokens light/dark, animações)
├── React + Babel (CDN)
├── ui.jsx          → componentes primitivos
├── data.jsx        → mock data
├── screens-feed.jsx    → Feed, Search, Rankings, Profile, Onboarding
├── screens-prompty.jsx → Prompty Detail, Create, Test, Remix
└── App (inline) → roteador e state global
```

---

## Temas

O protótipo suporta **light** e **dark theme** via classes CSS.

### Tokens Light

```css
--bg: #F8F7F2;
--bg-2: #FFFFFF;
--header-bg: rgba(248,247,242,0.85);
--card-bg: #FFFFFF;
--chip-bg: #EDEAE2;
--chip-bd: #E2DED4;
--text-1: #171717;
--text-2: #4A4A4A;
--text-3: #8A8A8A;
--input-bg: #F4F2EC;
--input-bd: #E2DED4;
--code-bg: #1A1B26;
--code-fg: #C8CDDA;
--btn-2-bg: #F0EDE5;
--btn-2-bd: #E2DED4;
```

### Tokens Dark

```css
--bg: #090A14;
--bg-2: #0E1020;
--header-bg: rgba(9,10,20,0.85);
--card-bg: #131526;
--chip-bg: #1A1D32;
--chip-bd: #272A3A;
--text-1: #F5F7FA;
--text-2: #B5BAC8;
--text-3: #6E7388;
--input-bg: #131526;
--input-bd: #272A3A;
--code-bg: #06070D;
--code-fg: #C8CDDA;
--btn-2-bg: #1A1D32;
--btn-2-bd: #272A3A;
```

---

## Animações CSS

| Nome | Efeito |
|------|--------|
| `fadeIn` | opacity 0→1 |
| `slideUp` | translateY(20px) + opacity |
| `toastIn` | translate(-50%, 12px) + opacity |
| `shimmer` | shimmer de skeleton loader |
| `screenFade` | tela inteira fading in com translateY(6px) |

Cada tela usa `.screen` com `animation: screenFade .25s cubic-bezier(.2,.8,.2,1)`.

---

## Device Frame

O protótipo renderiza dentro de um iOS frame (`components/ios-frame.jsx`) centrado na página. Background da página:

```css
.page-bg {
  background:
    radial-gradient(circle at 20% 20%, rgba(124,58,237,0.12), transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(34,211,238,0.10), transparent 55%),
    linear-gradient(180deg, #f3f0ec 0%, #e9e5dd 100%);
}
```

---

## Telas implementadas

### Feed (AppHeader + FeedCard)
- Header sticky com blur (`backdrop-filter: blur(20px) saturate(180%)`)
- Logo SVG inline
- PointsPill com barra de progresso de nível
- Botão "Criar Prompty" (L3)
- Busca como botão falso (abre SearchScreen)
- Feed cards com: capa, chips de modelo, dificuldade, versão, autor, stats, ações (like/save/remix)

### Prompty Detail (PromptyScreen)
- Cover hero 360px com gradiente de overlay
- Botões flutuantes (back, like, save, share)
- Chips: modelo(s), dificuldade, versão
- 4 abas: Inputs / Testes / Avaliações / Remixes
- Aba Inputs: lista de InputField por tipo + preview do prompt montado
- Botão "Copiar prompt" fixo no bottom
- `assembleFinalPrompt()` — substitui `{{key}}` pelos valores dos inputs

### Create Flow (L3)
- 3 passos com barra de progresso
- Passo 1: título, descrição, categoria, capa (image-slot)
- Passo 2: textarea monospace para o template
- Passo 3: resumo + publicação (+50p)

### Search (L2+)
- Barra de busca com clear
- Categorias em grid 2×4
- "Em alta esta semana" (scroll horizontal)
- Criadores em destaque
- Resultados em grid 2 colunas

### Rankings (L3)
- Toggle Semana / Mês / Geral
- Pódio visual (altura variável)
- Lista posições 4+ com delta de ranking
- Usuário logado destacado

### Profile (L2+)
- Hero com TierRing + avatar + nível + streak
- Barra de progresso para próximo nível
- 4 stat cards
- 4 abas: Progresso / Missões / Conquistas / Biblioteca
- Biblioteca: Usados / Salvos (grid 2 colunas)

---

## State Management (Protótipo)

State global via `useReducer`. Actions principais:
- `go` — navegar para tela
- `back` — voltar
- `toggleLike` — like/unlike por prompty id
- `toggleSave` — save/unsave
- `copy` — registrar cópia
- `rate` — registrar avaliação
- `publish` — publicar novo prompty

---

## O que implementar a partir deste protótipo

| Área | Telas / Componentes |
|------|-------------------|
| Autenticação | Signup / Login (não tem no protótipo — Supabase Auth) |
| Feed | FeedCard, AppHeader, FeedScreen |
| Prompty Detail | PromptyScreen com 4 abas |
| Busca | SearchScreen |
| Rankings | RankingsScreen |
| Perfil | ProfileScreen com abas |
| Criar | CreateScreen (3 passos) |
| Gamificação | Níveis, badges, missões, pódio |
| Design system | Tokens CSS, componentes primitivos |
| Data | Supabase schema (substituir mocks) |
