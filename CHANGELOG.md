# Release Notes

---

## [Unreleased](https://github.com/ricasolucoes/Prompty/compare/v0.3.0...develop)

## [v0.3.0 (2026-06-21)](https://github.com/ricasolucoes/Prompty/compare/v0.2.0...v0.3.0)

### ✨ Novidades

- [x] **Créditos** — saldo auditável via ledger imutável `credit_events` + cache `profiles.credits`; bônus de 1 crédito concedido automaticamente no cadastro (idempotente), histórico próprio visível e saldo nunca negativo (CRED-01..04)
- [x] **Ganhar créditos contribuindo** — triggers server-side concedem crédito ao subir de nível, publicar prompty e enviar resultado aprovado, com tetos anti-farming (EARN-01..04)
- [x] **Geração de imagem in-app** — usuário logado gera uma imagem a partir do prompt gastando 1 crédito, com skeleton/estimativa, imagem inline, CTA de cadastro para anônimos e nudge de contribuição para saldo zero (GEN-01, GEN-05..07)

### 🎨 Melhorias

- [x] **Refund automático** — falha do provedor/storage/DB devolve o crédito automaticamente e o usuário vê erro + confirmação de refund (GEN-04)
- [x] **Débito atômico** — `spend_credit` com advisory lock evita double-spend em cliques concorrentes; guard de `inFlight` no frontend (GEN-03)

### 🔧 Técnico

- [x] **Edge Function `generate-image`** — orquestrador Deno seguro (JWT → circuit breaker/cap → spend → provider → upload → insert → signed URL → refund-on-fail); chave do provedor vive só em `Deno.env`, nunca no bundle (GEN-02)
- [x] **Provider-agnostic** — adapter trocável por secret `ACTIVE_PROVIDER`: mock default + stubs Gemini/OpenAI/Replicate (GEN-08)
- [x] **Infra** — circuit breaker `app_settings`, cron keep-alive (free tier), FK de auditoria `generations.credit_event_id`; suíte frontend em 229 testes, todas as fases Nyquist-compliant

## [v0.2.0 (2026-05-29)](https://github.com/ricasolucoes/Prompty/compare/v0.1.0...v0.2.0)

### ✨ Novidades

- [x] **Ranking da comunidade** — `RankingPage` real substitui o placeholder "Em breve": leaderboard por pontos (top 100), pódio 🥇🥈🥉, nível e selo de verificado, link para o perfil público e indicador da sua posição quando fora do top (GAME2-01)

### 🔧 Técnico

- [x] **`useRanking`** — hook RLS-safe que lê `profiles` ordenado por `points` (nunca expõe `is_admin`); `myRank` resolvido pela lista visível ou por contagem de quem está à frente quando o usuário fica fora do top
- [x] **Cobertura de testes** — 3 `it.todo` de `RateSheet` substituídos por testes reais (estrelas, upload de imagem, submit) + testes de `useRanking` e `RankingPage`; a suíte passa de 193 → **207 testes**, zero `todo`
- [x] **Build** — `manualChunks` isola o vendor `@supabase` em chunk próprio; o chunk principal cai de 611 kB → 404 kB e o aviso de chunk >500 kB desaparece

## [v0.1.0 (2026-05-18)](https://github.com/ricasolucoes/Prompty/releases/tag/v0.1.0)

Primeiro release público do Promptys — MVP com progressão L1 → L2 → L3 completa.

### ✨ Novidades

- [x] **L1 Iniciante — Feed e Copiar** — Feed cursor-based, leitura sem cadastro, copiar prompts resolvidos
- [x] **L2 Curador + Descoberta** — Busca textual, filtros por categoria/modelo, salvar favoritos, avaliar promptys, enviar resultados gerados, denunciar conteúdo, sugerir categorias
- [x] **L3 Criador** — Wizard de criação em 4 passos (básico → prompt → imagem → avançado), templates com variáveis `{{var}}`, criação de variações, estatísticas de promptys criados
- [x] **Gamificação por níveis** — Sistema de pontos (`point_events` + triggers SQL), 5 níveis (L1..L5), modal de level-up, progress card de próximo desbloqueio
- [x] **Auth + perfis** — Supabase Auth (email/senha + reset), perfis públicos por `@username`, edição de perfil
- [x] **Tauri 2.0 desktop + mobile** — Build configurada para macOS/Windows/Linux/Android/iOS

### 🎨 Melhorias

- [x] Resultados da comunidade no detalhe do Prompty (grid 3x3, full image modal)
- [x] Onboarding inicial com call-to-action sem fricção
- [x] Toast feedback contextual para cópia/save/avaliação
- [x] Skeletons + scroll infinito no Feed e Search
- [x] Atalho "Criar variação" no detalhe (L3+ only)

### 🐛 Correções

- [x] **Phase 3.1 gap closure** — `AuthStore.refetchProfile` mantém `profile.points` sincronizado in-session (fix gamificação)
- [x] `PrivateRoute` ativo em `/saved /search /criar /ranking` (LEVL-07 — bloqueia URL direta para usuários sem nível suficiente)
- [x] `useSaved` filtra `status = 'published'` em joins (MODR-03 — promptys moderados não vazam em Salvos/Avaliações/Resultados)
- [x] `ProfilePage` nudge agora é level-aware (L2→L3 mostra copy correta)
- [x] `WizardStep2Prompt` detecta `{{variavel}}` inline (CREAT-02 — sem `inputs_schema` vazio quando publica do step 2)

### 🔧 Técnico

**Release v0.1.0 — code health & CI green:**

- [x] **ESLint v9 migração** — `.eslintrc.json` → `eslint.config.js` (flat config). Adiciona `@eslint/js`, `globals`, `tsconfig.eslint.json` para type-aware linting de testes
- [x] **Lint zero erros** — bugs (`no-floating-promises`, `no-misused-promises`, `no-uniq-key`, `no-implied-eval`, `pseudo-random`) corrigidos; `Readonly<Props>` aplicado em todos componentes React; constantes extraídas para `var(--text-*)` reutilizadas
- [x] **Versão** — projeto fixado em `0.1.0` (`package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`)
- [x] **Clippy doc** — `lib.rs:run()` ganhou doc `# Panics`; `build.rs` semicolon
- [x] **Prettier** — 40+ arquivos reformatados (CI `format:check` agora passa)
- [x] **Cargo fmt** — Rust formatado com padrão 4-space (era 2-space)
- [x] **Database** — 7 migrations Supabase versionadas (`20260507000001` → `20260512000007`)
- [x] **Quality gate** — `pnpm quality:all` passa: format + lint + type-check + cpd + circular deps + cargo fmt/clippy/test/audit + vitest (193 testes)

**Milestone v1.0 audit:**

- Requirements verified: 43/43 ✓
- Phases verified: 4/4 ✓ (1 — L1, 2 — L2, 3 — L3, 3.1 — Gap closure)
- Integration: 10/10 ✓
- E2E flows: 3/3 ✓ (L1 / L2 / L3 user journeys)
- Tech debt aceito: `RateSheet` test stubs (3 `it.todo`), `RankingPage` placeholder (v2), admin moderation via Supabase Dashboard

**Tech debt deferida para v2:**

- Refactor de páginas grandes (`PromptyDetailPage` 285 lines, `FeedCard` 182 lines) — atualmente com `eslint-disable max-lines-per-function` documentado
- `import/no-unused-modules` desativado (incompat com flat config + falsos positivos no Vite)
- `sonarjs/deprecation` desativado (falsos positivos em `@types/react@19`)
- `sonarjs/slow-regex` desativado (falsos positivos em character classes bounded)
- jscpd threshold elevado de 5% → 8% (forms duplicados naturais entre `LoginPage`/`SignupPage`/`FeedPage`/`SearchPage`)
