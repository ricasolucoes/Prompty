# Roadmap: Promptys

## Overview

Promptys é construído seguindo a progressão natural do usuário: primeiro consome (L1), depois valida (L2), depois cria (L3). As fases do roadmap espelham essa progressão. A Fase 1 entrega a experiência L1 completa — o usuário deve conseguir copiar um prompt, usar no Gemini e voltar para dar feedback sem precisar entender nada mais. Fases seguintes desbloqueiam progressivamente a profundidade sem jamais degradar a simplicidade da home L1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (1.1, 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: L1 Iniciante — Feed e Copiar** - Schema/auth/RLS/tracking interno + feed público + copiar prompt + feedback básico + desbloqueio de nível (gap closure in progress 2026-05-07) (completed 2026-05-07)
- [ ] **Phase 2: L2 Curador + Descoberta** - Upload de resultado + avaliação + histórico + denúncia + filtros de feed + busca
- [ ] **Phase 3: L3 Criador** - Criar/publicar promptys + variações + estatísticas + modo avançado opcional

## Phase Details

### Phase 1: L1 Iniciante — Feed e Copiar
**Goal**: Qualquer visitante pode navegar o feed, ler um prompt pronto, copiá-lo e usar no Gemini; usuários autenticados podem salvar e marcar feedback; o sistema registra ações internamente para cálculo de nível sem exibir gamificação
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, SOCL-01, SOCL-02, SOCL-03, PROF-01, PROF-02, PROF-03, LEVL-01, LEVL-02, LEVL-03, LEVL-04, LEVL-05, LEVL-06, LEVL-07, INFR-01, INFR-02, INFR-03, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. Visitante não autenticado abre o app, vê o card "Como funciona", navega o feed de promptys com imagem + título + prompt visível, e copia um prompt com um toque sem precisar criar conta
  2. Usuário autenticado pode salvar um prompty e marcar "Funcionou" ou "Não ficou bom"
  3. Cada cópia, save e feedback é registrado internamente via trigger SQL; a interface L1 não exibe pontos, ranking, badges, comentários, remix ou editor avançado em nenhuma situação
  4. Todas as tabelas têm RLS habilitado; escritas de eventos internos só acontecem via triggers (nunca pelo frontend)
  5. Quando critérios de L2 são atingidos, o sistema exibe mensagem discreta de desbloqueio
**Plans**: 11 plans (9 original + 2 gap closure)
  - [x] 01-01-PLAN.md — Vitest setup + design tokens (CSS variables/animations) + pure libs (levelOf, resolveBeginner, compressToWebP) with unit tests
  - [x] 01-02-PLAN.md — Supabase migrations: schema (9 tables) + RLS + triggers (points engine + auto-profile + level transitions) + Storage bucket + regenerate types
  - [x] 01-03-PLAN.md — Seed 6 prototype promptys + demo author (idempotent SQL via tsx generator)
  - [x] 01-04-PLAN.md — Auth Zustand stores (auth + level) + useAuth hook (signUp/signIn/signOut/reset) + PrivateRoute + main.tsx wiring (QueryClient, BrowserRouter, onAuthStateChange listener)
  - [x] 01-05-PLAN.md — UI primitives (Icon, Avatar, Buttons, ProgressBar, Toast) + AppHeader + TabBar (LEVL-07 RTL test) + Onboarding + Login/Signup/ResetPassword pages + theme toggle store
  - [x] 01-06-PLAN.md — Feed: useFeed (cursor pagination FEED-05) + WelcomeStrip + FeedCard (LEVL-06 RTL test) + SkeletonCard + FeedPage
  - [x] 01-07-PLAN.md — Copy flow (clipboard browser + Tauri fallback + record_copy RPC) + RateSheet (5 stars + image upload) + useCopy + useTest (with WebP compression INFR-03/04) + Toast wiring + manual smoke checkpoint
  - [x] 01-08-PLAN.md — useLike (optimistic) + useSave + useProfile + LevelUpModal + ProfilePage L1 + PublicProfilePage + manual smoke checkpoint
  - [x] 01-09-PLAN.md — INFR-05 weekly cron (GitHub Actions + check-supabase-usage.ts) + dev-only TweaksPanel + final UAT walkthrough
  - [ ] 01-10-PLAN.md — GAP CLOSURE: PromptyDetailPage `/p/:slug` (FEED-03) + Salvar button on detail page wiring `useSave` (SOCL-01) + FeedCard title becomes Link
  - [ ] 01-11-PLAN.md — GAP CLOSURE: `profiles.last_active_at` migration + auth listener touchLastActive + LEVL-02 design annotation + LevelUpModal LEVL-03 unlock copy fix

### Phase 2: L2 Curador + Descoberta
**Goal**: Usuários que atingiram L2 podem enviar imagens geradas, avaliar qualidade e ajudar a curar a biblioteca; feed ganha filtros, busca e moderação básica
**Depends on**: Phase 1
**Requirements**: FEED-06, FEED-07, CUR-01, CUR-02, CUR-03, CUR-04, CUR-05, MODR-01, MODR-02, MODR-03
**Success Criteria** (what must be TRUE):
  1. Usuário L2 pode fazer upload de imagem gerada como resultado de um prompty
  2. Usuário L2 pode avaliar qualidade e tem histórico de promptys copiados e salvos
  3. Usuário pode filtrar o feed por categoria e modelo, e buscar por palavra-chave
  4. Usuário pode denunciar conteúdo; admin pode alterar status do prompty
**Plans**: 7 plans
  - [ ] 02-01-PLAN.md — Migration 006 (reports + category + fts + is_admin) + types regen + 13 Wave 0 test scaffolds
  - [ ] 02-02-PLAN.md — TabBar Salvos tab + new icons (moreHorizontal, flag, tag) + /saved + /search routes + CATEGORIES/MODELS constants
  - [ ] 02-03-PLAN.md — useSearch hook (FTS + filters + cursor) + FilterChipBar + SearchPage (FEED-06, FEED-07, MODR-03)
  - [ ] 02-04-PLAN.md — useSaved hook + SavedCard + SavedPage with 3-chip filter (CUR-03)
  - [ ] 02-05-PLAN.md — useReport + useCommunityResults + generic OptionsSheet (CUR-04, CUR-05, MODR-01)
  - [ ] 02-06-PLAN.md — ReportSheet + CategorySuggestSheet + PromptyDetailPage "..." menu wiring (CUR-04, CUR-05, MODR-01)
  - [ ] 02-07-PLAN.md — CommunityResults + FullImageModal + PromptyDetailPage integration + MODR-03 audit (CUR-01, CUR-02, MODR-03)

### Phase 3: L3 Criador
**Goal**: Usuários que atingiram L3 podem criar e publicar promptys; modo avançado com variáveis e versões disponível opcionalmente; estatísticas básicas do próprio conteúdo
**Depends on**: Phase 2
**Requirements**: CREAT-01, CREAT-02, CREAT-03, CREAT-04, CREAT-05
**Success Criteria** (what must be TRUE):
  1. Usuário L3 pode criar um prompty com título, imagem exemplo, prompt beginner, categoria, tags e modelo recomendado, e publicá-lo no feed
  2. Usuário L3 pode ver quantas cópias, saves e feedbacks seus promptys receberam
  3. Usuário L3 pode criar variações simples de um prompty existente
  4. Modo avançado (template com variáveis, prompt negativo, versões) disponível opcionalmente para usuários L3 sem alterar a experiência L1 da home
**Plans**: 6 plans
  - [ ] 03-01-PLAN.md — Migration (parent_id, prompty-covers bucket, publish trigger) + types regen + Wave 0 test scaffolds
  - [ ] 03-02-PLAN.md — useCreatePrompty hook (publish/cover/parent_id/version) + useMyPromptys hook (stats aggregation)
  - [ ] 03-03-PLAN.md — Wizard core: CreateWizard state machine + WizardStep1Basics + WizardStep2Prompt + WizardProgressBar
  - [ ] 03-04-PLAN.md — MyPromptyCard + MyPromptysGrid (L3-gated stats grid) + ProfilePage integration
  - [ ] 03-05-PLAN.md — WizardStep3Image + WizardStep4Advanced + VariableChip + CriarPage + App.tsx route
  - [ ] 03-06-PLAN.md — TabBar update (sparkle Criar route) + RankingPage placeholder + PromptyDetailPage variation button

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. L1 Iniciante — Feed e Copiar | 11/11 | Complete   | 2026-05-07 |
| 2. L2 Curador + Descoberta | 1/7 | In Progress|  |
| 3. L3 Criador | 0/6 | Not started | - |
