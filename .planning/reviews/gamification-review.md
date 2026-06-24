# Gamification Review — Promptys

**Data:** 2026-06-23
**Escopo:** Sistema completo de gamificação — pontos, níveis, créditos, earn/spend/refund, anti-abuso, RLS, e o Edge Function de geração.
**Método:** Review multi-agente adversarial (7 dimensões). O workflow bateu no limite de sessão e não concluiu a verificação automatizada; o review foi finalizado por leitura direta do código (migrations 001–010, Edge Function, RLS).

---

## 1. Sumário executivo

**Saúde geral: boa arquitetura, com 1 falha CRÍTICA que bloqueia o go-live de produção.**

A base é sólida: tabelas de eventos append-only (`point_events`, `credit_events`, `unlock_events`), RLS com `WITH CHECK (false)` para todo insert de cliente, mutação financeira em `profiles` barrada por trigger `SECURITY INVOKER`, `spend_credit` atômico (advisory lock + `FOR UPDATE`), idempotência por `ON CONFLICT (user_id, event_type, ref_id)`.

**Porém** há uma rota de **crédito infinito** via `refund_credit`, exposta diretamente ao cliente. Antes de ligar a geração paga (OpenAI), isso precisa ser corrigido.

| Severidade | Qtde |
|---|---|
| 🔴 Critical | 1 |
| 🟠 High | 0 |
| 🟡 Medium | 2 |
| 🔵 Low | 2 |

---

## 2. Achados confirmados

### 🔴 CRITICAL — `refund_credit` permite crédito infinito (GAM-001)
**Local:** `supabase/migrations/20260531000008_phase4_credits_ledger.sql:200-226`

```sql
CREATE OR REPLACE FUNCTION refund_credit(p_ref UUID DEFAULT NULL) ...
  INSERT INTO credit_events (user_id, event_type, delta, ref_id)
  VALUES (v_user_id, 'refund', 1, p_ref)            -- +1, p_ref controlado pelo cliente
  ON CONFLICT DO NOTHING;
...
GRANT EXECUTE ON FUNCTION refund_credit(UUID) TO authenticated;   -- exposto via PostgREST
```

**Problema:** a função é `SECURITY DEFINER`, concedida a `authenticated`, e insere um evento de `+1` crédito usando um `p_ref` **fornecido pelo cliente**, **sem verificar que existe um `spent_generation` correspondente**. Como o `ON CONFLICT` é em `(user_id, event_type, ref_id)`, basta variar o `p_ref`:

```js
// qualquer usuário logado, no console do app:
for (let i = 0; i < 1000; i++)
  await supabase.rpc('refund_credit', { p_ref: crypto.randomUUID() })
// → +1000 créditos
```

**Impacto:** anula a economia de créditos inteira (o objetivo do milestone v0.3.0). Cada crédito = 1 geração `gpt-image-1` = custo real na OpenAI. Mitigação parcial: o Edge Function limita 5 gerações/dia/usuário, então o gasto direto por conta é limitado — mas a integridade econômica some e múltiplas contas multiplicam o custo.

**Correção (entregue):** `refund_credit` só credita se existir um `spent_generation` com aquele `(user_id, ref_id)`; o `ON CONFLICT (user_id,'refund',ref_id)` garante no máximo 1 refund por gasto. Ver `supabase/migrations/20260623000011_harden_refund_credit.sql`. O caminho legítimo (Edge Function reembolsa após falha do provedor, usando o mesmo `generation_id` do spend) continua funcionando.

---

### 🟡 MEDIUM — Resultados auto-aprovados são farmáveis (10 créditos/dia sem moderação) (GAM-002)
**Local:** `supabase/migrations/20260621000010_phase5_earn_credits.sql:14-15,99-124` + RLS `prompty_tests_insert_own` (`20260507000002_rls_policies.sql:29`)

`prompty_tests.approved` tem `DEFAULT true` e o usuário pode inserir os próprios `prompty_tests` (RLS `WITH CHECK (user_id = auth.uid())`). O trigger `award_credit_on_approved_result` dá +1 por linha (cap diário 10, `ref_id = NEW.id`). Logo um usuário pode submeter 10 "resultados" lixo/dia → +10 créditos/dia, sem nenhuma validação. É o mecanismo de earn projetado (auto-aprovação, `LOOP-02` de revogação adiado), mas registra-se como dívida: o cap segura, a qualidade não. Recomendo, no futuro, `approved = false` por default + aprovação assíncrona, ou um sinal de qualidade mínimo.

### 🟡 MEDIUM — TOCTOU no cap diário de geração (GAM-003)
**Local:** `supabase/functions/generate-image/index.ts:83-91`

O cap diário conta linhas de `generations` e **depois** gasta/insere; não há lock cobrindo a janela count→insert. Requisições concorrentes podem ambas passar pelo `count < 5` e exceder o cap em alguns. Sem crédito grátis (cada uma debita), só ultrapassa levemente o teto de custo. Baixo impacto, mas real. Mitigação: contar dentro de uma transação com advisory lock por usuário, ou checar o cap após o spend.

### 🔵 LOW — Salto multi-nível sub-credita e é inconsistente com a 009 (GAM-004)
**Local:** `20260621000010_phase5_earn_credits.sql:41-63` vs `20260507000004_unlock_events.sql:23-36`

`record_level_transition` insere **uma** linha em `unlock_events` por mudança de nível, mesmo num salto L1→L3. O trigger da phase5 dá +2 fixos por linha → um salto multi-nível dá +2 (não +2 por nível). Além disso, a migration 009 dava +1 por nível e a phase5 dá +2 por transição — usuários que subiram antes/depois da phase5 receberam valores diferentes. Baixo impacto (saldo), mas inconsistente.

### 🔵 LOW — `update_profile_credits`/`update_profile_points` chamáveis via RPC (GAM-005)
**Local:** `008:65`, `003:45` (sem `REVOKE` de PUBLIC)

Por padrão o Postgres concede `EXECUTE` a `PUBLIC`; essas funções ficam expostas via PostgREST. São inofensivas (apenas recomputam o cache a partir do ledger, sem criar saldo), mas pelo princípio de menor privilégio convém `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`.

---

## 3. Pontos verificados e APROVADOS (sem achado)

- **RLS append-only:** `point_events`, `credit_events`, `unlock_events`, `generations` — todos `WITH CHECK (false)` para insert de cliente, `select` só do próprio. ✓
- **Guarda financeira em `profiles`:** trigger `guard_profiles_financial_columns` é `SECURITY INVOKER` (correto — `SECURITY DEFINER` nunca dispararia) e bloqueia update direto de `credits/points/level`. ✓
- **`spend_credit` atômico:** `pg_advisory_xact_lock` + `SELECT ... FOR UPDATE` + `CHECK (credits >= 0)`. Double-spend protegido. ✓
- **Signup bonus idempotente:** índice parcial `credit_events_signup_once` cobre o caso `ref_id NULL`. ✓
- **Cadeia de level-up intacta após a phase5:** points → `profiles.level` → `record_level_transition` → `unlock_events` → `trg_credit_on_level_up` (+2). O drop do trigger antigo em `profiles` e a redefinição da função estão coerentes com a ordem de aplicação por nome de arquivo (008 → 010 app_settings → 009 levelup → phase5). ✓
- **Independência points × credits:** triggers de crédito são irmãos dos de ponto; nenhum altera o outro. ✓
- **`search_path` fixo** em todas as funções `SECURITY DEFINER`. ✓

---

## 4. Cobertura / limitações deste review

- Revisado a fundo por leitura direta: migrations 002, 003, 004, 008, 009, phase5(010), e o Edge Function.
- **Não** auditado em profundidade nesta passada (workflow interrompido pelo limite de sessão): camada de confiança do frontend (hooks/stores/LevelUpModal), políticas de `app_settings`, e a real cobertura dos testes SQL/RTL. Risco baixo (RLS server-side é a defesa primária), mas recomenda-se completar quando o limite resetar.

## 5. Checklist de remediação (prioridade)

1. [x] **GAM-001 (crítico):** `refund_credit` endurecido — migration `20260623000011`, aplicada em prod 2026-06-23.
2. [x] GAM-005 (low): `REVOKE EXECUTE` de `update_profile_*` — migration `20260623000011`, aplicada.
3. [x] GAM-003 (medium): cap diário + spend atômicos via `spend_generation_credit` (advisory lock único) + Edge Function — migration `20260624000012`, aplicada e função redeployada (v2).
4. [x] GAM-002 (medium): crédito de resultado agora exige `image_url` não-vazio (anti-farm) — migration `20260624000012`. Moderação completa (`approved=false` default) segue como futuro `LOOP-02`.
5. [x] GAM-004 (low): `award_credit_on_level_up` credita +2 POR nível cruzado em saltos multi-nível (ref determinístico por nível) — migration `20260624000012`.

**Status:** todos os achados do review (GAM-001..005) resolvidos e aplicados em produção em 2026-06-24.
Pendência de processo, não de código: re-rodar o review automatizado multi-agente (interrompido pelo limite de sessão) para cobrir a fundo frontend-trust, app_settings policies e cobertura de testes.
