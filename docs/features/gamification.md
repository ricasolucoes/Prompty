# Gamificação

Sistema de progressão que recompensa contribuição real e guia o usuário do consumo passivo até a criação.

---

## Níveis de Experiência

O sistema usa **5 níveis de progressão** (L1–L5). Os três primeiros (L1/L2/L3) controlam o *progressive disclosure* de funcionalidades — cada um desbloqueia novas telas. L4 e L5 são expansão pós-MVP.

O modelo de 7 níveis em `data.jsx` é o protótipo V1 (descartado). O modelo canônico é o de `gamification.jsx`.

### Modelo canônico — 5 níveis (`gamification.jsx`)

| ID | Nome | Threshold | Cor | Emoji |
|----|------|-----------|-----|-------|
| L1 | Explorador | 0–49p | `#22D3EE` | 🌱 |
| L2 | Curador | 50–249p | `#7C3AED` | ✨ |
| L3 | Criador | 250–999p | `#FF6B4A` | 🎨 |
| L4 | Mestre | 1.000p+ | `#FFB020` | 👑 |
| L5 | Lendário | 5.000p+ | `#EC4899` | 🔮 |

### Modelo descartado — V1 (`data.jsx`, não usar)

7 níveis usados no protótipo V1. Substituído pelo modelo acima.

| N | Nome | Threshold |
|---|------|-----------|
| 1 | Curioso Visual | 0 |
| 2 | Aprendiz de Prompt | 100 |
| 3 | Prompt Crafter | 500 |
| 4 | Remix Alchemist | 1.500 |
| 5 | Style Architect | 5.000 |
| 6 | Model Whisperer | 10.000 |
| 7 | Hall of Promptys | 25.000 |

---

## Economia de Pontos

### Ações que geram pontos

| Ação | Pontos | Limite | Nível requerido |
|------|--------|--------|-----------------|
| Copiar um Prompty | +5p | — | L1 |
| Avaliar um Prompty usado | +5p | uma vez por prompty | L1 |
| Curtir | +1p | 10/dia | L1 |
| Login diário (streak) | +2p/dia | — | L1 |
| Publicar Prompty | +50p | — | L3 |
| Remix aceito pela comunidade | +25p | — | L3 |

### Regra crítica de implementação

Pontos são concedidos **exclusivamente** via triggers SQL na tabela `point_events` (imutável). Nenhuma lógica de frontend pode inserir ou alterar pontos diretamente.

---

## Badges (Conquistas)

### Categorias

**Onboarding**
- `first_copy` — Primeiro Copy (Bronze) — `copy_count >= 1`
- `first_rate` — Voz da Comunidade (Bronze) — `rate_count >= 1`
- `first_save` — Coleção Iniciada (Bronze) — `save_count >= 1`

**Volume**
- `curious_10` — Curioso (Silver) — `copy_count >= 10`
- `critic_5` — Crítico (Silver) — `rate_with_image >= 5`
- `collector_25` — Colecionador (Silver) — `save_count >= 25`

**Criação (L3+)**
- `first_prompty` — Primeira Receita (Gold) — `create_count >= 1`
- `remix_master` — Mestre do Remix (Gold) — `remix_accepted >= 5`
- `trendsetter` — Tendência (Gold) — `trended >= 1`

**Streak**
- `streak_7` — Semana Cheia (Silver) — `streak >= 7`
- `streak_30` — Mês Lendário (Gold) — `streak >= 30`

**Qualidade**
- `helpful_50` — Útil (Gold) — `helpful_count >= 50`
- `verified` — Verificado (Platinum) — `verified === true` (L4+)

### Tiers e visual

| Tier | Borda |
|------|-------|
| Bronze | `linear-gradient(135deg,#cd7f32,#8b5a2b)` |
| Silver | `linear-gradient(135deg,#e5e7eb,#9ca3af)` |
| Gold | `linear-gradient(135deg,#FFD700,#FF9500)` |
| Platinum | `linear-gradient(135deg,#7C3AED,#22D3EE,#FF6B4A)` |

Badges não conquistadas aparecem com `opacity: 0.4` e label "bloqueado".

---

## Missões

Missões diárias e semanais para criar recorrência de uso.

### Missões diárias (resetam à meia-noite)

| Missão | Recompensa |
|--------|-----------|
| Copie 1 Prompty | +5p |
| Avalie 2 Promptys que você usou | +10p |
| Curta 5 Promptys | +3p |

### Missões semanais (resetam segunda-feira)

| Missão | Recompensa | Requer |
|--------|-----------|--------|
| Mantenha streak de 5 dias | +25p | — |
| Publique 1 Prompty novo | +50p | L3 |
| Faça 2 remixes | +30p | L3 |

---

## Ranking

Ranking semanal de criadores por pontos acumulados no período. Visível apenas para L3+.

- Escopos: Semana / Mês / Geral
- Pódio para os 3 primeiros (visual: barras de altura diferente + emoji de medalha)
- Posições 4+ em lista com delta de posição (`▲/▼ N`)
- Usuário logado sempre aparece destacado (fundo `primary-soft`, borda `primary`)

---

## Modal de Level Up

Ao cruzar o threshold de nível, exibe modal celebrativo (1 vez, dispensável):
- Emoji e nome do novo nível em destaque
- Descrição das funcionalidades desbloqueadas
- CTA: "Continuar explorando"
- Tab bar anima novos ícones aparecendo (não "estavam cinza")

**Regra de UX**: em nenhum momento o usuário vê uma tela com cadeado. O que ele não pode usar simplesmente não é mostrado.
