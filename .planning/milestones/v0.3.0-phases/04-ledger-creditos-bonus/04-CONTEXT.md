# Phase 4: Ledger de Créditos + Bônus de Cadastro - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** Discussão na sessão de milestone v0.3.0 (decisões já tomadas com o usuário) + research SUMMARY.md

<domain>
## Phase Boundary

Esta fase entrega **apenas a infraestrutura de créditos** — provider-independente, 100% testável offline, sem Edge Function e sem geração de imagem (isso é a Phase 6).

Entrega:
- Tabela `credit_events` (ledger imutável, append-only) espelhando exatamente o padrão de `point_events`.
- Coluna cacheada `profiles.credits`.
- Bônus automático de +1 crédito no cadastro (idempotente, exatamente uma vez).
- Saldo visível na UI (badge no AppHeader).
- Histórico próprio de créditos (RLS select-own).
- Funções `spend_credit()` e `refund_credit()` (usadas pela Phase 6, mas criadas e testáveis agora).
- Tabela `generations` + bucket privado `prompty-generations` (criados cedo por build-order; escritos só na Phase 6).

NÃO entrega: nenhuma forma de ganhar crédito além do signup (isso é a Phase 5), nenhuma geração de imagem (Phase 6).
</domain>

<decisions>
## Implementation Decisions (LOCKED — decididas com o usuário)

### Modelo de dados — espelhar point_events
- `credit_events` é append-only, igual a `point_events`. Colunas: `id uuid pk`, `user_id uuid → profiles(id) ON DELETE CASCADE`, `event_type text CHECK (...)`, `delta integer NOT NULL`, `ref_id uuid NULL`, `created_at timestamptz default now()`.
- `event_type` permitidos: `signup_bonus`, `earned_contribution`, `spent_generation`, `refund`, `admin_grant`. (Phase 5 usa `earned_contribution`/variantes; Phase 6 usa `spent_generation`/`refund`.)
- Coluna cacheada: `profiles.credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0)`.
- Função `update_profile_credits(target_user uuid)` recalcula `SUM(delta)` → `profiles.credits` (cópia fiel de `update_profile_points`).

### RLS append-only (espelhar point_events)
- `credit_events`: `SELECT` apenas do próprio (`user_id = auth.uid()`); `INSERT` bloqueado para `anon, authenticated` (`WITH CHECK (false)`); sem policies de `UPDATE`/`DELETE`. Escrita só via funções `SECURITY DEFINER`.

### CRÍTICO — bloquear mutação direta de profiles.credits
- A policy existente `profiles_update_own` permite `UPDATE profiles SET credits = 999 WHERE id = auth.uid()`. Isso é um furo.
- Correção: `BEFORE UPDATE` trigger em `profiles` que, quando `current_setting('role')`/sessão é `authenticated` (cliente), rejeita qualquer mudança em `NEW.credits <> OLD.credits` (e idealmente também `points`/`level` se já não estiver protegido). Apenas funções `SECURITY DEFINER` (que setam contexto) podem alterar. Espelha a intenção de `point_events_no_client_insert`.

### Bônus de cadastro (idempotente)
- Estender `handle_new_user()`: APÓS o `INSERT INTO profiles` (FK precisa do profile existir), inserir `credit_events (user_id, event_type, delta) VALUES (NEW.id, 'signup_bonus', 1)` e chamar `update_profile_credits(NEW.id)`.
- Idempotência: índice único parcial `CREATE UNIQUE INDEX credit_events_signup_once ON credit_events (user_id) WHERE event_type = 'signup_bonus'` (+ `ON CONFLICT DO NOTHING`). Rodar `handle_new_user` duas vezes nunca cria dois bônus.

### Débito atômico — spend_credit() (criada agora, usada na Phase 6)
- `spend_credit(p_ref uuid DEFAULT NULL)` `SECURITY DEFINER SET search_path = public`:
  - `pg_advisory_xact_lock(hashtext(auth.uid()::text))` para serializar por usuário (anti double-spend).
  - `SELECT credits ... FOR UPDATE` na linha de `profiles`.
  - Se `credits < 1` → retorna `(ok=false, balance)`.
  - Senão insere `credit_events(user_id, event_type, delta, ref_id) VALUES (auth.uid(), 'spent_generation', -1, p_ref)`; `update_profile_credits`; retorna `(ok=true, balance)`.

### Refund — refund_credit() (compensating event)
- `refund_credit(p_ref uuid DEFAULT NULL)` `SECURITY DEFINER`: insere `credit_events delta=+1, event_type='refund', ref_id=p_ref`; `update_profile_credits`. Usada pela Edge Function da Phase 6 no caminho de falha.

### Build-order — criar cedo (barato)
- Tabela `generations`: `id uuid pk`, `user_id uuid → profiles`, `prompty_id uuid → promptys NULL`, `credit_event_id uuid → credit_events NULL`, `image_path text`, `provider text`, `created_at`. RLS select-own.
- Bucket privado `prompty-generations` com acesso via signed URL (RLS de Storage por dono). A Edge Function que faz upload chega na Phase 6.

### Frontend
- Badge de saldo no `AppHeader` ao lado do badge de nível (inline styles, padrão Phase 1). Ícone tipo "🎟️"/token + número.
- `profiles.credits` já vem no `select('*')` do `refetchProfile` (auth store) — `useCredits` é um selector de 1 linha sobre o profile no store. Sem nova query.
- Página/sheet simples de histórico de créditos (opcional, atende CRED-04) consultando `credit_events` do próprio usuário, ordenado por `created_at desc`.
- Regenerar `src/types/database.types.ts` via `pnpm gen:types` após a migration.

### Estilo / convenções
- Inline styles (padrão Phase 1, sem CSS Modules/styled-components).
- Migration SQL nova em `supabase/migrations/` seguindo a numeração existente (próxima após as 7 atuais + as de phase 3).
- Cores do design system (Electric Violet #7C3AED etc.) para o badge.

### Claude's Discretion
- Nome exato do arquivo de migration e do trigger de guarda.
- Layout exato do badge e da tela de histórico.
- Se o histórico de créditos é uma página dedicada ou um sheet no Perfil.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Padrão a espelhar (point_events)
- `supabase/migrations/20260507000001_initial_schema.sql` — schema de `profiles` e `point_events` (colunas, CHECK, índices).
- `supabase/migrations/20260507000002_rls_policies.sql` — policies `point_events_select_own`, `point_events_no_client_insert`, `profiles_update_own` (a que precisa ser endurecida).
- `supabase/migrations/20260507000003_triggers_points.sql` — `handle_new_user`, `update_profile_points`, `level_from_points`, `record_copy`, `award_points_on_like` (padrão de cap). ESTES são o blueprint exato.

### Frontend
- `src/store` — auth store com `refetchProfile` (faz `select('*')`).
- `src/components/layout/AppHeader.tsx` — onde o badge de nível vive; adicionar o de créditos ao lado.
- `src/lib/constants/levels.ts` — padrão de "fonte única de constantes".
- `src/types/database.types.ts` — regenerar após migration.

### Research desta milestone
- `.planning/research/ARCHITECTURE.md` — design completo de schema, RLS, spend/refund, ordem de build.
- `.planning/research/PITFALLS.md` — furo do `profiles_update_own`, double-spend, idempotência do signup bonus.
- `.planning/research/SUMMARY.md` — resumo executivo.

### Regras do projeto
- `CLAUDE.md` — "pontos só via triggers, nunca update direto do frontend"; RLS em todas as tabelas; inline styles.
</canonical_refs>

<specifics>
## Specific Ideas

- Success criteria observáveis (do ROADMAP.md):
  1. Recém-cadastrado vê "1 crédito" no AppHeader sem ação; `handle_new_user` 2× não duplica bônus.
  2. Usuário vê só o próprio histórico de créditos.
  3. `credit_events`.insert do client → erro RLS; `profiles`.update({credits:999}) → bloqueado.
  4. Dois `spend_credit()` paralelos com 1 crédito → exatamente 1 sucesso, saldo nunca negativo.
- Teste do double-spend deve ser explícito (concorrência) — não só um insert sequencial.
</specifics>

<deferred>
## Deferred Ideas

- Ganhar créditos por contribuição (nível/publicação/resultado) → Phase 5.
- Edge Function de geração + upload em `generations`/bucket + escolha de provider → Phase 6.
- Compra/pagamento de créditos → out of scope (REQUIREMENTS.md).
</deferred>

---

*Phase: 04-ledger-creditos-bonus*
*Context gathered: 2026-05-31 (decisões de milestone) — equivalente ao output de discuss-phase*
