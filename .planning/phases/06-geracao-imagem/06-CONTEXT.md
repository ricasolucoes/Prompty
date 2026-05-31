# Phase 6: Geração de Imagem in-app - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** Discussão de milestone v0.3.0 + decisão explícita do usuário: "planejar tudo agora, Phase 6 com provider MOCK" (troca por provider real depois via secret)

<domain>
## Phase Boundary

Esta fase entrega a **geração de imagem in-app gastando 1 crédito**, ponta a ponta, com **provider MOCK** como implementação default (para ser executável/testável SEM nenhuma API key). Os adapters de provedores reais (Gemini/OpenAI/Replicate) entram como stubs plugáveis — trocar = setar secret + preencher 1 arquivo.

Entrega:
- Edge Function `supabase/functions/generate-image/` (Deno): JWT → caps/circuit-breaker → spend_credit → provider adapter → upload Storage → insert generations → signed URL; refund automático em qualquer falha pós-spend.
- Provider adapter interface + implementação `mock` (default) + stubs `gemini`/`openai`/`replicate`.
- Frontend: hook `useGenerate`, botão "Gerar imagem (1 crédito)" no PromptyDetailPage, com todos os estados (anon / sem saldo / com saldo / loading / sucesso / erro+refund).
- Atualização de `CLAUDE.md` + `AGENTS.md` (exceção do Edge Function à regra "sem backend").
- Keep-alive cron (GitHub Actions) no mesmo PR.

Depende de Phase 4 (spend_credit, refund_credit, generations, bucket) e Phase 5 (earn — para o nudge "contribua para ganhar"). Escreve nas tabelas/bucket criados na Phase 4.
</domain>

<decisions>
## Implementation Decisions (LOCKED)

### Provider: MOCK como default (decisão do usuário)
- `ACTIVE_PROVIDER` secret default = `mock`. O mock retorna uma imagem placeholder determinística (ex.: um PNG/WebP simples gerado em memória ou um asset estático pequeno) com um pequeno delay simulado (~1–2s) para exercitar a UX de loading.
- Adapter interface: `interface ImageProvider { generate(prompt: string): Promise<{ bytes: Uint8Array; mimeType: string }> }`.
- Um arquivo por provedor em `supabase/functions/generate-image/providers/`: `mock.ts` (completo), `gemini.ts`/`openai.ts`/`replicate.ts` (stubs que leem a key do env e lançam "not configured" se ausente). Seleção por `ACTIVE_PROVIDER`.
- Um modo de falha forçada no mock (ex.: prompt contendo `__FORCE_FAIL__` ou env `MOCK_FAIL=1`) para testar o caminho de refund (success criterion 2).
- Troca para real depois = `supabase secrets set ACTIVE_PROVIDER=gemini && supabase secrets set GEMINI_API_KEY=<key>` + preencher `gemini.ts`. Nenhuma mudança em créditos/UI.

### Edge Function (guardrails OBRIGATÓRIOS — de PITFALLS.md/roadmap)
- `verify_jwt = true` no `config.toml` — NUNCA false. `user_id` derivado SÓ do JWT verificado (`getUser()`), nunca do body.
- Pre-mint `generation_id` (UUID) ANTES do spend; passar como `ref_id` para `spend_credit(p_ref)` → auditabilidade.
- Fluxo: validar JWT → checar circuit breaker `generation_enabled` (tabela `app_settings`) + cap diário de geração por usuário → `spend_credit(generation_id)`; se ok=false → 402 "sem créditos". → provider.generate() com `AbortSignal.timeout(120_000)` → comprimir WebP < 200KB → upload no bucket privado `prompty-generations` → insert `generations` (id=generation_id, user_id, prompty_id, credit_event_id, image_path, provider) → criar signed URL → retornar. QUALQUER falha após o spend chama `refund_credit(generation_id)` antes de retornar erro.
- CORS: incluir `http://tauri.localhost` e `tauri://localhost` na allow-list; handler `OPTIONS` explícito. (Usar helper de CORS do supabase-js se disponível, senão headers manuais.)
- Sanitização: prompt length ≤ 1500 chars + denylist básico de injection.
- `app_settings` (nova tabela simples key/value OU reusar config existente): flag `generation_enabled` (circuit breaker global) + base para cap diário.

### Frontend (estados — o gancho de conversão)
- Hook `useGenerate`: `supabase.functions.invoke('generate-image', { body: { prompty_id, prompt } })`; trata sucesso (URL), erro (+ refund confirmado), loading.
- Botão "Gerar imagem (1 crédito)" no `PromptyDetailPage`, ao lado de "Copiar prompt" (inline styles, design system).
- Estados:
  - **Anônimo:** botão vira CTA "Cadastre-se e ganhe 1 crédito para gerar" → navega para `/signup`. (GEN-06)
  - **Logado, 0 créditos:** nudge específico "Contribua para ganhar mais" listando ações reais (publicar, enviar resultado, subir de nível — da Phase 5) — NÃO paywall de compra. (GEN-07)
  - **Logado, saldo ≥1:** ao tocar, desabilita o botão imediatamente (anti duplo-clique → anti double-spend no client, além do lock no server), mostra skeleton com estimativa (~10s), exibe imagem inline ao concluir, decrementa o badge (refetchProfile). (GEN-01, GEN-05)
  - **Erro:** mensagem clara + "Seu crédito foi devolvido". (GEN-04, GEN-05)
- Anti duplo-clique no client é defesa em profundidade; a garantia real é o `pg_advisory_xact_lock` no `spend_credit` (Phase 4). (GEN-03)

### Documentação (regra do projeto)
- Atualizar `CLAUDE.md` e `AGENTS.md` NO MESMO commit: adicionar exceção explícita "Edge Functions (Supabase) são permitidas para guardar segredos de terceiros (ex.: API key de geração de imagem); o frontend continua anon-key client-side only e nunca recebe segredos." (CLAUDE.md hoje diz "sem backend próprio".)

### Keep-alive
- Workflow GitHub Actions (cron a cada ~5 dias) que faz um request leve ao Supabase para evitar auto-pause do free tier. No mesmo PR (não adiável — o projeto já pausou uma vez).

### Claude's Discretion
- Formato exato do placeholder do mock (PNG gerado vs asset estático).
- Estrutura de `app_settings` (tabela nova mínima vs reuso).
- Onde exibir a imagem gerada (inline no detail, modal, ou seção).
- Valor do cap diário de geração (ex.: 5/dia) — começar conservador.
</decisions>

<canonical_refs>
## Canonical References

### Base desta fase (Phase 4) — funções/objetos que a Edge Function chama
- `.planning/phases/04-ledger-creditos-bonus/04-02-PLAN.md` — `spend_credit(p_ref)`, `refund_credit(p_ref)`, tabela `generations`, bucket `prompty-generations`.
- `.planning/phases/05-ganhar-creditos-contribuindo/05-02-PLAN.md` — ações de earn (para o texto do nudge "contribua para ganhar").

### Research
- `.planning/research/STACK.md` — scaffolding/deploy/secrets de Edge Function, `supabase.functions.invoke`, JWT, Storage de dentro da function, shapes dos provedores (para os stubs).
- `.planning/research/ARCHITECTURE.md` — fluxo completo da Edge Function.
- `.planning/research/PITFALLS.md` — JWT, CORS Tauri, AbortSignal/timeout, refund race, key leakage, free-tier, double-spend.

### Frontend existente a espelhar
- `src/pages/PromptyDetailPage.tsx` — onde fica o botão "Copiar prompt" (adicionar "Gerar imagem" ao lado); padrão de estados/toast.
- `src/hooks/useCopy.ts` — padrão de hook best-effort + refetchProfile.
- `src/lib/supabase.ts` — client (usar `supabase.functions.invoke`).
- `src/store` — auth store (user/profile/credits, refetchProfile).
- `src/components/ui/PrimaryButton.tsx` — botão.

### Regras
- `CLAUDE.md` / `AGENTS.md` — atualizar (exceção Edge Function); RLS; sem key no frontend; inline styles; acesso nativo via tauri invoke.
</canonical_refs>

<specifics>
## Specific Ideas

Success criteria (do ROADMAP.md):
1. Logado com 1 crédito → "Gerar imagem" → skeleton ~10s → imagem inline; saldo cai para 0.
2. Falha do provedor (mock force-fail) → linha `refund` em credit_events + saldo restaurado; usuário vê erro + confirmação de refund.
3. Anônimo vê CTA de cadastro; duplo-clique rápido não debita 2x.
4. `grep -r "VITE_.*KEY\|VITE_.*TOKEN" src/` retorna VAZIO (nenhuma key no bundle).
5. Chamada do Tauri Android build não retorna erro de CORS.
</specifics>

<deferred>
## Deferred Ideas
- Provider real (Gemini/OpenAI/Replicate) — stubs prontos; preencher quando o usuário escolher e setar o secret. Mock cobre o fluxo agora.
- Enviar imagem gerada como resultado da comunidade (ganhar crédito de volta) → Future LOOP-01.
- Rate limiting avançado além do cap diário simples → Future OPS-01.
- Retention/cleanup de imagens órfãs → Future OPS-02.
- Compra de créditos → out of scope.
</deferred>

---

*Phase: 06-geracao-imagem*
*Context gathered: 2026-05-31 — provider MOCK default (executável sem key); adapters reais plugáveis depois*
