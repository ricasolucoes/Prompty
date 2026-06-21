# Milestones

## v0.3.0 Créditos + Geração de Imagem in-app (Shipped: 2026-06-21)

**Phases completed:** 3 phases, 8 plans

**Key accomplishments:**

- Ledger de créditos imutável (`credit_events`) com saldo não-negativo via triggers/RPC server-side e bônus de 1 crédito idempotente no cadastro (CRED-01..04)
- Mecânica de earn: triggers SECURITY DEFINER concedem créditos por subir de nível, publicar prompty e enviar resultado aprovado, com tetos anti-farming server-side (EARN-01..04)
- Edge Function `generate-image` (Deno) provider-agnostic — segredo do provedor nunca chega ao frontend; débito atômico de 1 crédito com refund automático em falha (GEN-01..04, GEN-08)
- UX honesto de geração: skeleton/estimativa, imagem inline, CTA de cadastro para anônimos e nudge de contribuição para saldo zero (GEN-05..07)
- Adapter de provedor trocável por secret (mock default + stubs Gemini/OpenAI/Replicate); cron keep-alive e circuit breaker `app_settings`
- 16/16 requisitos satisfeitos, todas as fases Nyquist-compliant; FK de auditoria `generations.credit_event_id` corrigida no fechamento

---

## v1.0 Promptys MVP — Progressão L1 → L2 → L3 (Shipped: 2026-05-13)

**Phases completed:** 4 phases, 26 plans, 9 tasks

**Key accomplishments:**

- (none recorded)

---
