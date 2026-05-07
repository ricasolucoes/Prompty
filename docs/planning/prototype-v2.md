# Protótipo V2 — Promptys v2.html (Modo Iniciante)

Arquivo: `docs/planning/prototypes/Promptys v2.html`

Protótipo focado em **progressive disclosure**: mesma app, três experiências diferentes controladas pelo nível do usuário (L1/L2/L3). É o protótipo mais recente e define o comportamento do MVP.

---

## Estrutura do Arquivo

```
docs/planning/prototypes/
├── Promptys v2.html              → app principal
├── Promptys.html                 → protótipo v1 completo
├── components/image-slot.js      → web component para upload de imagem
├── components/ios-frame.jsx      → frame iOS com status bar
├── components/tweaks-panel.jsx   → painel lateral de debug
├── gamification.jsx              → níveis, badges, missões, ranking, telas L2+
├── data.jsx                      → mock data (usuários, promptys, testes, remixes)
├── screens-feed.jsx              → Feed, Search, Rankings, Profile
├── screens-prompty.jsx           → Prompty Detail, Create, Test, Remix
├── ui.jsx                        → componentes primitivos (Icon, Avatar, Chip, Button...)
└── BEGINNER_MODE_SPEC.md         → spec original do modo iniciante
```

---

## Diferenças em relação ao V1

| Aspecto | V1 (Promptys.html) | V2 (Promptys v2.html) |
|---------|-------------------|----------------------|
| Gamificação | 7 níveis (data.jsx) | 5 níveis L1–L5 (gamification.jsx) |
| Progressive disclosure | Não | Sim — tab bar e telas mudam por nível |
| Tweaks panel | Não | Sim — alterna dark/light + nível L1/L2/L3 |
| Card L1 | Não implementado | Sim — card estilo Facebook |
| Variáveis | Editáveis sempre | L1: pré-preenchidas e invisíveis |
| Avaliação L1 | Multi-dimensional | 1 pergunta (5 estrelas) |

---

## Tweaks Panel

Painel de debug lateral (`components/tweaks-panel.jsx`) com:
- Toggle Dark/Light mode
- Radio **Nível do usuário**: L1 / L2 / L3

Padrão: `{ dark: false, level: "L3" }`

Permite stakeholder ver qualquer estado sem ganhar pontos. **Deve existir em dev/staging, nunca em produção.**

---

## Tokens CSS

### V2 Light

```css
--bg: #FAF9F5;
--surface: #FFFFFF;
--surface-2: #F4F1EA;
--header-bg: rgba(250,249,245,0.92);
--line: #E7E3DA;
--line-strong: #D9D4C8;
--text-1: #181818;
--text-2: #555;
--text-3: #8A8784;
--primary: #7C3AED;
--primary-soft: rgba(124,58,237,0.10);
--like: #FF3B6B;
```

### V2 Dark

```css
--bg: #0E0F18;
--surface: #161826;
--surface-2: #1C1F30;
--header-bg: rgba(14,15,24,0.9);
--line: #262A3C;
--line-strong: #2F3447;
--text-1: #F4F5FA;
--text-2: #B0B5C5;
--text-3: #6D7388;
--primary: #9D6BFA;
--primary-soft: rgba(157,107,250,0.16);
--like: #FF5C84;
```

> **Nota:** No dark, `--primary` é `#9D6BFA` (mais claro que `#7C3AED`) para acessibilidade.

---

## Componentes inline do V2

### Avatar

```jsx
// Círculo com cor do usuário + iniciais
// Props: user, size
```

### Header

```jsx
// Sticky header com: Logo "Promptys", dark/light toggle, level badge
// Recebe prop `level` (L1/L2/L3) para mostrar badge correto
```

### FeedCard L1

Estrutura específica do L1 (estilo Facebook):
1. Header: avatar + nome + tempo
2. Texto do prompt (3 linhas + "Ver mais")
3. Imagem (full-width, image-slot)
4. Reações: curtir + contagem
5. Botão primário "Copiar prompt" → vira "✓ Copiado · avaliar"
6. Banner pós-cópia

### Prompt montado (L1)

No L1, o prompt já vem pré-montado (variáveis substituídas pelo valor padrão). O array `PROMPTYS` do V2 tem campo `prompt` (string resolvida), diferente do V1 que usa `template` + `inputs`.

---

## Fluxo de Avaliação L1

```
[📋 Copiar prompt] → click
  → botão: [✓ Copiado · avaliar]
  → banner: "Copiado. Cole no Gemini..."
  → tap "avaliar" → bottomSheet ou modal
    → "Funcionou bem?" (5 estrelas)
    → upload foto opcional (image-slot)
    → [Enviar +5p]
```

---

## Telas gerenciadas por gamification.jsx

ProfileScreenV2, SearchScreen, RankingsScreen, CreateScreen — carregados dinamicamente. L1 usa telas internas do V2, L2+ carrega essas telas do gamification.jsx.

### ProfileScreenV2
- Hero com TierRing por tier (bronze L1, silver L2, gold L3, platinum L4+)
- Pontos calculados live: `copiedIds.size * 5 + ratedIds.size * 5 + min(liked.size, 10)`
- Level calculado por `levelOf(points)`

### Modal LevelUpModal
- Aparece quando `levelOf(points)` muda
- Animação `pop` (cubic-bezier(.2,1.4,.4,1))
- Lista itens desbloqueados por nível (L2/L3/L4 tem listas específicas)

---

## image-slot Web Component

Arquivo: `components/image-slot.js`

Custom element `<image-slot>` que aceita drag-drop ou tap para upload de imagem. CSS variables para customização:
- `--is-bg` — background
- `--is-border` — borda
- `--is-fg` — cor do ícone/texto de placeholder

Props: `shape` (rounded/circle), `radius`, `placeholder`.

---

## ios-frame Component

Arquivo: `components/ios-frame.jsx`

Frame visual de iPhone com status bar. Exibe o app dentro de um dispositivo centrado na página. Aceita `dark` prop para status bar clara/escura.

---

## O que implementar a partir do V2

| Área | Prioridade | Observação |
|------|-----------|------------|
| Tokens CSS light + dark | Alta | Base de tudo — definir em Tailwind ou CSS vars |
| Card L1 (estilo Facebook) | Alta | Ponto de entrada do produto |
| Fluxo copiar → avaliar (L1) | Alta | Loop principal de valor |
| Onboarding (1 slide) | Alta | Primeira impressão |
| Tab bar progressiva | Alta | 2 abas (L1), 3 (L2), 5 (L3) |
| Avatar + Header | Alta | Presentes em todas as telas |
| LevelUpModal | Média | Celebração ao subir de nível |
| ProfileScreenV2 | Média | Progresso + missões + conquistas |
| SearchScreen | Média | Disponível só L2+ |
| RankingsScreen | Baixa | Disponível só L3 |
| CreateScreen | Baixa | Disponível só L3 |
| TweaksPanelDev | Dev | Nunca em produção |
