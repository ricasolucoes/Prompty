# Roadmap: Promptys

## Overview

Promptys é construído seguindo a progressão natural do usuário: primeiro consome (L1), depois valida (L2), depois cria (L3). As fases do roadmap espelham essa progressão. A v1.0 (MVP) entregou a experiência completa L1 → L2 → L3 com gap closure de integração. O v0.3.0 adiciona a economia de créditos e geração de imagem in-app.

## Milestones

- ✅ **v1.0 MVP — Progressão L1 → L2 → L3** — Phases 1–3.1 (shipped 2026-05-13) — see [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- 📋 **v0.3.0 — Créditos + Geração de Imagem in-app** — Phases 4–6 (started 2026-05-31)

## Phases

<details>
<summary>✅ v1.0 MVP — Progressão L1 → L2 → L3 (Phases 1–3.1) — SHIPPED 2026-05-13</summary>

- [x] Phase 1: L1 Iniciante — Feed e Copiar (11/11 plans) — completed 2026-05-07
- [x] Phase 2: L2 Curador + Descoberta (7/7 plans) — completed 2026-05-12
- [x] Phase 3: L3 Criador (6/6 plans) — completed 2026-05-13
- [x] Phase 3.1: Milestone Gap Closure (2/2 plans) — completed 2026-05-13

Full detail: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

### v0.3.0 — Créditos + Geração de Imagem in-app

- [x] **Phase 4: Ledger de Créditos + Bônus de Cadastro** — Infraestrutura imutável de créditos com bônus automático no signup (completed 2026-05-31)
- [ ] **Phase 5: Ganhar Créditos Contribuindo** — Triggers de earn (nível, publicação, resultado aprovado) com tetos anti-abuso
- [ ] **Phase 6: Geração de Imagem in-app** — Edge Function provider-agnostic com débito atômico, refund e UX completo

## Phase Details

### Phase 4: Ledger de Créditos + Bônus de Cadastro

**Goal**: Usuário tem um saldo de créditos auditável, protegido contra manipulação, com 1 crédito concedido automaticamente no cadastro — e a infraestrutura de debit/refund está pronta para fases seguintes usarem.

**Depends on**: Phase 3.1 (milestone v1.0 — `profiles`, `point_events`, `handle_new_user` existentes)

**Requirements**: CRED-01, CRED-02, CRED-03, CRED-04

**Success Criteria** (what must be TRUE):
  1. Usuário recém-cadastrado abre o app e vê "1 crédito" no AppHeader sem nenhuma ação adicional — e roda `handle_new_user` duas vezes não cria dois eventos de bônus
  2. Usuário vê o próprio histórico de créditos (ganhos e gastos) e não consegue ver o histórico de outro usuário
  3. Tentar `supabase.from('credit_events').insert(...)` diretamente do client retorna erro de RLS — e tentar `supabase.from('profiles').update({ credits: 999 })` também é bloqueado
  4. Chamar `spend_credit()` duas vezes em paralelo para um usuário com exatamente 1 crédito resulta em exatamente uma transação bem-sucedida e uma falha — saldo nunca fica negativo

**Implementation notes**:
  - `credit_events` append-only: `WITH CHECK (false)` + `BEFORE UPDATE` trigger guard em `profiles.credits` para o role `authenticated`
  - `CHECK (credits >= 0)` na coluna `profiles.credits`
  - Signup bonus idempotente via partial unique index: `CREATE UNIQUE INDEX credit_events_signup_once ON credit_events (user_id) WHERE event_type = 'signup_bonus'`
  - `spend_credit()` usa `SELECT FOR UPDATE` + `pg_advisory_xact_lock(user_id::bigint)` — ambos obrigatórios
  - `refund_credit()` e `generations` table criados aqui (FK pronto), mesmo que a Edge Function só chegue na Phase 6
  - `prompty-generations` bucket privado criado aqui com RLS de acesso por signed URL

**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Wave 0 test scaffolds (supabase/tests/ SQL smoke + RTL stubs)
- [ ] 04-02-PLAN.md — Migration: credit_events ledger, RLS, guard trigger, signup bonus, spend/refund, generations table + private bucket
- [ ] 04-03-PLAN.md — Frontend: useCredits selector, AppHeader credit badge, credit history sheet on ProfilePage


---

### Phase 5: Ganhar Créditos Contribuindo

**Goal**: Usuário acumula créditos realizando contribuições reais ao sistema — subindo de nível, publicando promptys e enviando resultados aprovados — com tetos server-side que tornam farming inviável.

**Depends on**: Phase 4 (credit_events ledger + update_profile_credits RPC existentes)

**Requirements**: EARN-01, EARN-02, EARN-03, EARN-04

**Success Criteria** (what must be TRUE):
  1. Usuário que sobe para L2 vê o saldo de créditos aumentar em até +2 — e repetir a ação (ex.: via dev reseed) não gera crédito extra além do teto de vida por evento
  2. Publicar um prompty aciona exatamente uma linha de `credit_events` com `event_type = 'publish_prompty'` e respeita o teto de 20 publicações por vida
  3. Enviar um resultado aprovado adiciona crédito, mas enviar mais do que o teto diário (10) não gera linhas adicionais naquele dia
  4. Nenhum dos três triggers modifica ou conflita com as triggers existentes de `point_events` — o histórico de pontos de gamificação permanece intacto

**Implementation notes**:
  - Migration única `20260531000009_phase5_earn_credits.sql` (próxima após a da Phase 4).
  - Schema: `ALTER prompty_tests ADD COLUMN approved BOOLEAN NOT NULL DEFAULT true` + estende o CHECK de `credit_events.event_type` com `level_up`, `publish_prompty`, `approved_result`.
  - Três triggers SECURITY DEFINER sobre tabelas existentes (irmãos das triggers de pontos):
    - `award_credit_on_level_up` em `unlock_events` AFTER INSERT (+2, uma vez por novo nível)
    - `award_credit_on_publish` em `promptys` AFTER INSERT OR UPDATE onde `status = 'published'` (+1, lifetime cap 20)
    - `award_credit_on_approved_result` em `prompty_tests` AFTER INSERT OR UPDATE onde `approved = true` (+1, diário cap 10)
  - `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` em cada insert de earn
  - Tetos verificados com `COUNT(*)` dentro da função trigger — nunca no client
  - Zero alteração nas funções e triggers de `point_events` existentes
  - Reconciliações: tabela de resultados é `prompty_tests` (não `prompty_results`); coluna `approved` é adicionada nesta migration (auto-aprovação)

**Plans**: 2 plans (2 waves)
  - [ ] 05-01-PLAN.md — Wave 0: smoke scripts earn01..earn04 (RED) em supabase/tests/
  - [ ] 05-02-PLAN.md — migration (approved + CHECK + 3 triggers), aplica e roda earn0*/cred0* GREEN

---

### Phase 6: Geração de Imagem in-app

**Goal**: Usuário logado com saldo pode gerar uma imagem dentro do app a partir do prompt de um Prompty, gastando 1 crédito de forma atômica — com refund automático em caso de falha e UX honesto sobre o estado da geração.

**Depends on**: Phase 4 (spend_credit, refund_credit, generations table, bucket), Phase 5 (earn mechanics validados). Requer decisão de provedor e configuração de secrets antes do início.

**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07, GEN-08

**Success Criteria** (what must be TRUE):
  1. Usuário logado com 1 crédito toca "Gerar imagem" em um PromptyDetailPage, vê skeleton com estimativa de tempo (~10s), e recebe a imagem inline — saldo cai para 0
  2. Simular falha do provedor (network error ou mock) resulta em linha `refund_credit` em `credit_events` e saldo restaurado — usuário vê mensagem de erro + confirmação de refund
  3. Usuário anônimo vê CTA "Cadastre-se e ganhe 1 crédito para gerar" no lugar do botão — clicar duas vezes rápido no botão de geração não executa dois débitos
  4. `grep -r "VITE_.*KEY\|VITE_.*TOKEN" src/` retorna vazio — a chave do provedor nunca está no bundle do frontend
  5. Chamada feita a partir do Tauri Android build não retorna erro de CORS

**Implementation notes**:
  - `verify_jwt = true` em `config.toml` — nunca `false`; `user_id` derivado exclusivamente do JWT verificado, nunca do body
  - Pre-mint `generation_id` UUID antes do spend; passado como `ref_id` para `spend_credit` para garantir auditabilidade completa
  - Provider adapter interface: um arquivo por provedor; troca = mudar `ACTIVE_PROVIDER` secret + adicionar/remover um arquivo
  - `AbortSignal.timeout(120_000)` no fetch ao provedor — garante tempo de refund antes do wall-clock de 150s do Edge Function
  - CORS headers via `@supabase/supabase-js/cors` (v2.95.0+): inclui `http://tauri.localhost` e `tauri://localhost`; handler `OPTIONS` explícito
  - Per-user daily generation cap + `generation_enabled` circuit breaker em `app_settings` — ambos dentro da Edge Function, antes do spend
  - Prompt length cap (≤1500 chars) + injection denylist básico na Edge Function
  - WebP compression < 200KB por imagem antes do upload no Storage (free tier: 1 GB total)
  - Keep-alive cron (GitHub Actions, a cada 5 dias) no mesmo PR — não adiável
  - Usuário com saldo 0 vê nudge "contribua para ganhar mais" com ações específicas listadas — não paywall de compra
  - **Prerequisite secrets**: `supabase secrets set ACTIVE_PROVIDER=gemini && supabase secrets set GEMINI_API_KEY=<key>`

**Plans**: 3 plans (3 waves)

Plans:
- [ ] 06-01-PLAN.md — Wave 0 scaffolds: config.toml [functions.generate-image], app_settings circuit-breaker migration, RED test scaffolds (useGenerate + PromptyDetailPage GEN cases), gen01/gen04 integration scripts, keep-alive cron
- [ ] 06-02-PLAN.md — Edge Function generate-image: provider adapter interface + mock (default) + gemini/openai/replicate stubs; orchestrator (JWT → breaker/cap → spend via userClient → provider → upload/insert via adminClient → signed URL → refund-on-fail)
- [ ] 06-03-PLAN.md — Frontend: useGenerate hook + PromptyDetailPage states (anon CTA / zero-credit nudge / generate button / inline image / error+refund) + CLAUDE.md & AGENTS.md Edge Function secret exception

---

## Progress

**Execution Order:**
Milestone v1.0 complete. Milestone v0.3.0 in progress — Phases 4–6.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. L1 Iniciante — Feed e Copiar | v1.0 | 11/11 | Complete | 2026-05-07 |
| 2. L2 Curador + Descoberta | v1.0 | 7/7 | Complete | 2026-05-12 |
| 3. L3 Criador | v1.0 | 6/6 | Complete | 2026-05-13 |
| 3.1. Milestone Gap Closure | v1.0 | 2/2 | Complete | 2026-05-13 |
| 4. Ledger de Créditos + Bônus de Cadastro | 3/3 | Complete   | 2026-05-31 | - |
| 5. Ganhar Créditos Contribuindo | 1/2 | In Progress|  | - |
| 6. Geração de Imagem in-app | v0.3.0 | 0/? | Not started | - |
