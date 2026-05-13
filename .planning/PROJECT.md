# Promptys

## What This Is

Promptys é uma biblioteca visual e gratuita de prompts prontos para geração de imagens com IA. A experiência inicial é extremamente simples: o usuário vê uma imagem de exemplo, lê um prompt pronto, copia e cola no Gemini ou outro app de geração. A complexidade — gamificação, criação, remix, variáveis avançadas — fica escondida e é desbloqueada progressivamente conforme o engajamento real do usuário.

## Core Value

O usuário copia um prompt pronto, gera uma imagem no Gemini, e volta para contar como ficou — essa é a única coisa que precisa funcionar no começo.

## Modelo de Progressão (3 Níveis)

### L1 Iniciante — Consumir

Objetivo: copiar prompt pronto e usar no Gemini.

**Mostra:**
- Imagem de exemplo
- Título do prompty
- Prompt pronto em texto simples (campo `beginner_prompt`)
- Botão "Copiar prompt" (ação principal)
- Instrução curta: "Copie e cole no Gemini ou outro app"
- Botão "Funcionou / Não ficou bom" (opcional)
- Botão "Salvar" se logado (opcional)
- Categorias básicas

**Esconde (invisível, não botão morto):**
- Ranking, pontos, badges, comentários, remix, variáveis, JSON/schema, editor avançado, prompt negativo, métricas, histórico de versões, testes avançados, número de avaliações

**Critério de desbloqueio para L2:** copiar ≥5 promptys + salvar ≥3 + marcar feedback algumas vezes + retornar ao app mais de uma vez

### L2 Curador — Validar

Objetivo: ajudar a organizar, validar e melhorar a biblioteca.

**Libera adicionalmente:**
- Favoritos e histórico de promptys copiados
- Feedback estruturado (Funcionou / Não funcionou)
- Envio de imagem gerada pelo usuário
- Avaliação simples de qualidade
- Sugestões de categoria
- Denúncia de conteúdo ruim
- Ver variações simples do mesmo prompt

**Ainda esconde:** ranking global, editor avançado, pontuação competitiva, remix técnico

**Critério de desbloqueio para L3:** enviar imagens geradas válidas + avaliar promptys + receber aprovação em contribuições + comportamento confiável

### L3 Criador — Publicar

Objetivo: criar, publicar e melhorar promptys.

**Libera adicionalmente:**
- Criar novo prompty (título, descrição, imagem exemplo, prompt)
- Adicionar tags e modelo recomendado
- Criar variações e ver estatísticas básicas do próprio conteúdo
- Modo avançado opcional (templates com variáveis, imagens de referência, prompt negativo, presets, versões, remix, testes comparativos)
- Ranking e reputação — apenas em área separada, nunca na home inicial

## Requirements

### Validated

**Fase 1 — L1 Iniciante** *(Validated in Phase 1: foundation — 2026-05-07)*
- [x] Usuário pode navegar o feed de promptys sem login
- [x] Cada card mostra imagem, título e prompt pronto visível
- [x] Usuário pode copiar o prompt com um toque (clipboard)
- [x] Usuário pode criar conta e autenticar via Supabase Auth
- [x] Card "Como funciona" aparece no topo do feed para novos usuários
- [x] Usuário pode salvar promptys (se logado) — via PromptyDetailPage
- [x] Usuário pode marcar "Funcionou / Não ficou bom" — via RateSheet (star rating)
- [x] Sistema registra cópias internamente (sem mostrar contador para L1)

**Fase 2 — L2 Curador + Descoberta** *(Validated in Phase 2: l2-curador-descoberta — 2026-05-12)*
- [x] Sistema detecta critérios de L2 e exibe mensagem de desbloqueio discreta (LevelUpModal Phase 1)
- [x] Usuário pode enviar imagem gerada como resultado — RateSheet + useTest + CommunityResults gallery
- [x] Usuário pode avaliar qualidade do prompty — RateSheet star rating (combinado com upload)
- [x] Usuário tem histórico de promptys copiados e salvos — SavedPage com 3 chips (Salvos/Avaliações/Resultados)
- [x] Usuário pode denunciar conteúdo impróprio — OptionsSheet + ReportSheet via "..." menu
- [x] Feed/busca por categoria + modelo + palavra-chave — SearchPage com FTS + FilterChipBar
- [x] MODR-03 enforcement — useFeed/useSearch/PromptyDetailPage filtram `.eq('status','published')`

**Fase 3 — L3 Criador** *(Validated in Phase 3: l3-criador — 2026-05-13)*
- [x] Usuário L3 pode criar e publicar promptys — CreateWizard 4 passos + useCreatePrompty + /criar route
- [x] Editor com título, descrição, imagem exemplo, prompt beginner e modelo recomendado — WizardStep1Basics + WizardStep2Prompt + WizardStep3Image
- [x] Usuário pode criar variações simples — `?from=<id>` query param + parent_id column + "Criar variação" button no PromptyDetailPage
- [x] Estatísticas básicas: cópias, saves, feedbacks — useMyPromptys + MyPromptysGrid no ProfilePage (L3-gated)
- [x] Modo avançado opcional: template com variáveis, prompt negativo, versões — WizardStep4Advanced + VariableChip + prompty_versions snapshot

### Active

— Nenhuma fase ativa. Milestone v1.0 completo. —

### Out of Scope

- Ranking na home inicial — polui a experiência L1; apenas em área separada para L3
- Gamificação visível (pontos/badges) no início — calculado internamente, exibido apenas quando relevante
- Editor avançado para L1 e L2 — desbloqueado progressivamente
- Anúncios de qualquer tipo — produto 100% gratuito e limpo
- Backend próprio no MVP — Supabase elimina a necessidade
- OAuth (Google/GitHub) no MVP — email/password suficiente para validar
- Monetização no MVP — decisão futura que não pode comprometer a biblioteca gratuita
- Importação automática de conteúdo externo — risco legal; curadoria manual apenas

## Modelo de Dados

### profiles
- id, username, avatar_url
- user_level: "l1_beginner" | "l2_curator" | "l3_creator"
- internal_points (calculado internamente, não exibido no L1)
- created_at

### promptys
- id, author_id, title, description
- beginner_prompt (texto plano, copiável)
- advanced_template (com {{variáveis}}, apenas para L3)
- example_image_url
- category, tags, recommended_model
- complexity_level: "simple" | "guided" | "advanced"
- status: draft | published | flagged | archived
- created_at, updated_at

### prompty_feedback
- id, prompty_id, user_id
- worked: boolean
- comment (opcional)
- created_at

### prompty_saves
- prompty_id, user_id, created_at

### prompty_results (L2+)
- id, prompty_id, user_id
- generated_image_url, notes
- approved, created_at

### unlock_events
- id, user_id, event_type
- previous_level, new_level
- created_at

## Context

- **Origem:** Grupo de compartilhamento de prompts; missão é dar uma casa técnica para esses prompts com experiência progressiva
- **Stack:** Tauri 2.0 + Vite + React + React Router + Zustand + Supabase (Auth, Postgres, Storage, Realtime, RLS) + Tailwind CSS 4 + custom components (sem shadcn)
- **Deploy:** app nativo via Tauri para Android/iOS/desktop; frontend React compila via Vite
- **Mobile-first:** app nativo mobile-first, navegação inferior (Feed / Perfil), cards grandes
- **Visual:** Midnight Ink #090A14, Electric Violet #7C3AED, Prompt Cyan #22D3EE — mas interface L1 é limpa, quase fórum visual
- **Identidade:** Gratuito, calmo, limpo, confiável — sem anúncios, banners ou elementos agressivos
- **RLS obrigatório** em todas as tabelas desde o início
- **Pontos calculados internamente** via triggers SQL — nunca exibidos para L1, exibidos para L3 apenas em área separada

## Constraints

- **Tech Stack:** Tauri 2.0 + Vite + React + Supabase — sem backend próprio no MVP; app nativo para Android/iOS
- **Custo:** Supabase free tier no MVP; monitorar limites
- **UX L1:** Zero gamificação visível; botão principal = "Copiar prompt"
- **Progressão:** Desbloqueios aparecem como mensagens discretas, não como jogo competitivo
- **Moderação:** Conteúdo adulto explícito, deepfakes e exploração são proibidos desde o início

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 3 níveis (L1/L2/L3) em vez de 7 | Mais simples de entender e implementar; "3 níveis são suficientes, mais vira imposto de renda gamificado" | ✓ Confirmado (v1.0) |
| Gamificação invisível no L1 | Usuário L1 só quer copiar e colar; exibir pontos/badges cria distração e complexidade desnecessária | ✓ Confirmado (v1.0) |
| `beginner_prompt` separado de `advanced_template` | Permite exibir prompt simples para L1 sem expor a sintaxe `{{variável}}` | ✓ Confirmado (v1.0) |
| Ranking apenas em área separada para L3 | Home inicial nunca mostra ranking; experiência L1 não é competitiva | ✓ Confirmado (v1.0) — RankingPage é placeholder, leaderboard em v1.1 |
| Tauri 2.0 + React como frontend (não Next.js/Flutter) | App nativo mobile com React; Supabase direto do cliente; Rust (Tauri core) disponível para features nativas futuras | ✓ Confirmado |
| Supabase como única infraestrutura de backend no MVP | Reduz custo, complexidade operacional e time-to-market | ✓ Confirmado (v1.0) |
| Inline styles em vez de Tailwind class-based | Estabelecido em Phase 1 e mantido por consistência; tokens via CSS vars no `:root` | ✓ Confirmado (v1.0) |
| Phase 3.1 gap closure como decimal phase | 5 cross-phase integration gaps fechados sem expandir escopo do v1.0 | ✓ Confirmado (v1.0) |

## Current State (v1.0 — shipped 2026-05-13)

Promptys MVP entregue: a progressão completa **L1 (Iniciante) → L2 (Curador) → L3 (Criador)** está ao vivo.

**Stats:** 4 phases · 26 plans · 193 tests · 9.274 LOC TypeScript · 7 migrations · 1 semana de execução

**Surfaces:** Feed público, PromptyDetailPage com copy/save/rate/results, ProfilePage (com MyPromptysGrid L3), SearchPage (FTS + chips), SavedPage (3 chips), CriarPage (wizard 4 passos com advanced template + variações), RankingPage (placeholder), OptionsSheet/ReportSheet/CategorySuggestSheet.

**Integrações cross-phase verificadas:** Gamification refetch within-session, route-level guards via PrivateRoute, MODR-03 status filter em useSaved, ProfilePage nudge level-aware, variable detection em Step 2.

## Next Milestone Goals (v1.1 — TBD)

A definir via `/gsd:new-milestone`. Candidatos baseados em PROJECT.md `Out of Scope` revisitado e backlog v2:
- RankingPage real (leaderboard + badges)
- Admin moderation UI (sair do Supabase Dashboard)
- Notificações (saves/results/feedback)
- OAuth (Google/GitHub)
- Otimizações de performance (lazy load, image CDN)
- Trending feed (hot-score algorithm)

---
*Last updated: 2026-05-13 — Milestone v1.0 shipped (4 phases, 26 plans, 193 tests, full L1→L2→L3 + gap closure complete)*
