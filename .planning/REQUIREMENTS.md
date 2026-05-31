# Requirements: Promptys — Milestone v0.3.0 (Créditos + Geração de Imagem)

**Defined:** 2026-05-31
**Core Value:** O usuário copia um prompt pronto, gera uma imagem, e volta para contar como ficou.

## v0.3.0 Requirements

Requirements deste milestone. Cada um mapeia para uma fase do roadmap.

### Créditos — Ledger e Saldo (CRED)

- [x] **CRED-01**: Usuário ganha 1 crédito automaticamente ao se cadastrar (exatamente uma vez, idempotente)
- [x] **CRED-02**: Usuário vê seu saldo de créditos na UI (badge no AppHeader)
- [x] **CRED-03**: Saldo de créditos nunca fica negativo e não pode ser alterado diretamente pelo client — só via ledger imutável + triggers/RPC server-side
- [x] **CRED-04**: Usuário pode ver o próprio histórico de eventos de crédito (ganhos e gastos), e apenas o seu (RLS select-own)

### Ganhar Créditos Contribuindo (EARN)

- [ ] **EARN-01**: Usuário ganha créditos ao subir de nível (ex.: +2 por novo nível, uma vez por nível)
- [ ] **EARN-02**: Usuário ganha crédito ao publicar um prompty (acoplado ao evento `publish` existente)
- [ ] **EARN-03**: Usuário ganha crédito ao enviar um resultado aprovado, com teto diário anti-abuso
- [ ] **EARN-04**: Sistema impede farming — cada evento concede crédito no máximo uma vez e respeita tetos diários (server-side, não confiável no client)

### Geração de Imagem in-app (GEN)

- [ ] **GEN-01**: Usuário logado com saldo ≥1 pode gerar uma imagem dentro do app, gastando 1 crédito
- [ ] **GEN-02**: A geração roda via Supabase Edge Function segura — a chave do provedor nunca chega ao frontend
- [ ] **GEN-03**: O débito de 1 crédito é atômico — cliques concorrentes não causam double-spend (lock por usuário)
- [ ] **GEN-04**: Se a geração falhar no provedor (ou no storage/DB), o crédito é devolvido automaticamente (refund)
- [ ] **GEN-05**: Usuário vê estado de carregamento com estimativa (~10s) e o resultado exibido inline, com erro claro + confirmação de refund quando falha
- [ ] **GEN-06**: Usuário anônimo vê o CTA "Cadastre-se e ganhe 1 crédito para gerar" no lugar do botão de geração (gancho de conversão)
- [ ] **GEN-07**: Usuário logado sem créditos vê um nudge específico "contribua para ganhar mais" — não um paywall de compra
- [ ] **GEN-08**: A geração é provider-agnostic — o provedor (Gemini/OpenAI/Replicate) é trocável por configuração/secret sem reescrever créditos ou UI

## Future Requirements (v2+)

Reconhecidos mas fora deste milestone.

### Loop de Contribuição

- **LOOP-01**: Usuário pode enviar a imagem gerada in-app como resultado da comunidade e ganhar crédito de volta
- **LOOP-02**: Admin/moderação UI para aprovar resultados (hoje via Supabase Dashboard)

### Operação e Escala

- **OPS-01**: Rate limiting avançado por usuário e circuit-breaker global de geração
- **OPS-02**: Limpeza/retention de imagens geradas órfãs no Storage (cron)
- **OPS-03**: Compra de créditos (monetização) — só após validar o loop gratuito

## Out of Scope

Excluído explicitamente deste milestone.

| Feature | Reason |
|---------|--------|
| Compra/pagamento de créditos | Monetização é decisão futura; não pode comprometer a biblioteca gratuita; valida-se o loop grátis primeiro |
| Persistir toda imagem gerada no servidor por padrão | Custo de Storage no free tier; só persiste quando o usuário envia como resultado da comunidade (fluxo `prompty-results` existente) |
| Escolha definitiva do provedor de imagem | Adiada pelo usuário; arquitetura usa adapter plugável (troca = 1 arquivo + 1 secret) |
| UI de moderação/aprovação de resultados | Usa fluxo existente / Supabase Dashboard no MVP deste milestone |
| Mudar o acesso público de ver/copiar promptys | Já é público e sem login; permanece inalterado |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRED-01 | Phase 4 | Complete |
| CRED-02 | Phase 4 | Complete |
| CRED-03 | Phase 4 | Complete |
| CRED-04 | Phase 4 | Complete |
| EARN-01 | Phase 5 | Pending |
| EARN-02 | Phase 5 | Pending |
| EARN-03 | Phase 5 | Pending |
| EARN-04 | Phase 5 | Pending |
| GEN-01 | Phase 6 | Pending |
| GEN-02 | Phase 6 | Pending |
| GEN-03 | Phase 6 | Pending |
| GEN-04 | Phase 6 | Pending |
| GEN-05 | Phase 6 | Pending |
| GEN-06 | Phase 6 | Pending |
| GEN-07 | Phase 6 | Pending |
| GEN-08 | Phase 6 | Pending |

**Coverage:**
- v0.3.0 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after milestone v0.3.0 definition*
