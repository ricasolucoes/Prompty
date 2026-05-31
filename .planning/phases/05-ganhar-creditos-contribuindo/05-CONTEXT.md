# Phase 5: Ganhar Créditos Contribuindo - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** Discussão de milestone v0.3.0 + reconciliação com o schema real (verificado nas migrations)

<domain>
## Phase Boundary

Esta fase adiciona **as formas de ganhar créditos contribuindo** — tudo via triggers SQL `SECURITY DEFINER` sobre tabelas existentes, com tetos server-side anti-farming. Provider-independente, testável offline.

Entrega:
- Crédito ao subir de nível (EARN-01).
- Crédito ao publicar um prompty (EARN-02).
- Crédito ao enviar um resultado (EARN-03).
- Anti-farming: cada evento concede no máximo uma vez + tetos (EARN-04).

NÃO entrega: nada de geração de imagem (Phase 6), nada de UI nova obrigatória (o badge de saldo da Phase 4 já reflete os ganhos automaticamente via refetchProfile). Pode incluir um nudge/toast opcional "ganhou crédito", mas a UI principal é a da Phase 4.

Depende da Phase 4: `credit_events`, `profiles.credits`, `update_profile_credits()`.
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### RECONCILIAÇÕES com o schema real (CRÍTICO — verificado nas migrations)
1. **A tabela de resultados é `prompty_tests`, NÃO `prompty_results`.** O roadmap e parte da pesquisa de milestone usaram o nome errado. Usar `prompty_tests` (migration 20260507000001, tem `image_url`).
2. **NÃO existe coluna `approved` em nenhuma tabela.** EARN-03 ("resultado aprovado") não tem em que disparar hoje, e a UI de moderação está fora de escopo deste milestone.
   - **DECISÃO:** a migration da Phase 5 adiciona `approved BOOLEAN NOT NULL DEFAULT true` em `prompty_tests` (auto-aprovação por enquanto). A trigger de earn dispara em `approved = true`. Quando a moderação chegar (Future LOOP-02), basta um fluxo que seta `approved=false` para revogar. Esse é o padrão "auto-approve + retroactive revoke" recomendado na pesquisa.
3. **O CHECK de `event_type` de `credit_events` (criado na Phase 4) só permite `('signup_bonus','earned_contribution','spent_generation','refund','admin_grant')`.** Os tipos de earn precisam existir.
   - **DECISÃO:** a migration da Phase 5 faz `ALTER TABLE credit_events DROP CONSTRAINT ... ADD CONSTRAINT` para incluir os novos tipos: `level_up`, `publish_prompty`, `approved_result` (além dos já existentes). Os success criteria do roadmap referenciam literalmente `event_type='publish_prompty'`.

### Três triggers AFTER INSERT/UPDATE, SECURITY DEFINER (espelhar award_points_on_like)
- **EARN-01 — `award_credit_on_level_up`** em `unlock_events` (AFTER INSERT). unlock_events tem colunas (id, user_id, previous_level, new_level, created_at). Concede `+2` créditos por novo nível atingido. Idempotente por nível: `ref_id` = id do unlock_event; `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING`. Teto de vida: no máximo 1 evento de crédito por `new_level` por usuário (COUNT por new_level dentro da função).
- **EARN-02 — `award_credit_on_publish`** em `promptys` (AFTER INSERT OR UPDATE) quando `status = 'published'`. Concede `+1`. `ref_id` = prompty id; `ON CONFLICT DO NOTHING` evita recontar a mesma publicação. Teto de vida: 20 publicações com crédito por usuário (COUNT dentro da função; acima disso não insere).
- **EARN-03 — `award_credit_on_approved_result`** em `prompty_tests` (AFTER INSERT OR UPDATE) quando `approved = true`. Concede `+1`. `ref_id` = prompty_tests id; `ON CONFLICT DO NOTHING`. Teto DIÁRIO: 10 por dia por usuário (COUNT WHERE created_at >= current_date dentro da função — espelha o cap diário de `award_points_on_like`).

### Regras transversais
- Tetos verificados com `COUNT(*)` DENTRO da função trigger — NUNCA confiando no client.
- Cada earn insere `credit_events` (delta>0) e chama `update_profile_credits(user_id)` para atualizar o cache.
- `ON CONFLICT (user_id, event_type, ref_id) DO NOTHING` em todos — exige unique constraint/índice compatível em credit_events (Phase 4 espelha point_events que tem `UNIQUE (user_id, event_type, ref_id)`; confirmar/garantir esse índice para os tipos de earn).
- ZERO alteração nas funções/triggers de `point_events` existentes — o histórico de pontos de gamificação permanece intacto. As triggers de crédito são irmãs, não substituem.
- Valores (+2/nível, +1 publish cap 20, +1 result cap 10/dia) são os defaults da pesquisa — ajustáveis, manter como fonte única em constantes SQL comentadas (ou um pequeno bloco de COMMENTs).

### Claude's Discretion
- Se há um toast/nudge "+1 crédito" no frontend ao ganhar (opcional, não obrigatório).
- Nome do arquivo de migration (próxima sequência após a da Phase 4).
- Estrutura exata das funções (uma função por trigger vs helper compartilhado).
</decisions>

<canonical_refs>
## Canonical References

### Padrão a espelhar
- `supabase/migrations/20260507000003_triggers_points.sql` — `award_points_on_like` (cap DIÁRIO via COUNT), `award_points_on_test`, `update_profile_points`. Blueprint exato dos triggers de earn.
- `supabase/migrations/20260512000007_phase3_criador.sql` — `award_points_on_publish` (padrão de earn em publish). Espelhar para créditos.
- A migration da Phase 4 (`20260531000008_phase4_credits_ledger.sql`) — `credit_events`, `update_profile_credits`, CHECK de event_type a estender, unique index.

### Tabelas-fonte (verificar colunas reais)
- `supabase/migrations/20260507000001_initial_schema.sql` — `prompty_tests` (id, prompty_id, user_id, image_url, ...), `promptys` (status), `point_events`.
- `supabase/migrations/20260507000004_unlock_events.sql` — `unlock_events` (id, user_id, previous_level, new_level, created_at).

### Regras
- `CLAUDE.md` — pontos/créditos só via triggers; RLS; nunca contornar.
- `.planning/research/PITFALLS.md` — idempotência de earn, caps server-side, não confiar no client.
</canonical_refs>

<specifics>
## Specific Ideas

Success criteria observáveis (do ROADMAP.md, ajustados às reconciliações):
1. Subir para L2 aumenta o saldo em +2; repetir a ação não gera crédito extra além do teto por nível.
2. Publicar um prompty insere exatamente 1 linha `credit_events` com `event_type='publish_prompty'`, respeitando o teto de 20/vida.
3. Enviar um resultado (auto-aprovado) adiciona crédito; acima do teto diário (10) não gera linhas novas naquele dia.
4. Nenhum dos três triggers modifica/conflita com as triggers de `point_events` — histórico de pontos intacto.
</specifics>

<deferred>
## Deferred Ideas
- UI de moderação/aprovação manual de resultados → Future (LOOP-02). Por ora `approved` default true.
- Loop "gerou in-app → envia como resultado → ganha crédito" → Future (LOOP-01) + depende da Phase 6.
- Geração de imagem / Edge Function / provider → Phase 6.
</deferred>

---

*Phase: 05-ganhar-creditos-contribuindo*
*Context gathered: 2026-05-31 — inclui reconciliação com schema real (prompty_tests, sem approved, event_type CHECK)*
