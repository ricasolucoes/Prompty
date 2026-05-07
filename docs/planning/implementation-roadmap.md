# Roteiro de Implementação — Referência para o GSD

Este documento mapeia os protótipos (`Promptys.html` e `Promptys v2.html`) para fases de implementação. Usa os protótipos como spec visual e de comportamento.

---

## Referências Visuais

| Arquivo | Usar para |
|---------|-----------|
| `docs/planning/prototypes/Promptys v2.html` | Spec principal do MVP (progressive disclosure) |
| `docs/planning/prototypes/Promptys.html` | Spec de referência para telas avançadas (L3) |
| `docs/planning/prototypes/BEGINNER_MODE_SPEC.md` | Regras de progressive disclosure por nível |
| `docs/planning/prototypes/gamification.jsx` | Spec de níveis, badges, missões, ranking |
| `docs/planning/prototypes/data.jsx` | Schema dos dados mockados → mapear para Supabase |
| `docs/planning/prototypes/screens-feed.jsx` | Implementação de referência do Feed |
| `docs/planning/prototypes/screens-prompty.jsx` | Implementação de referência do Prompty Detail |
| `docs/planning/prototypes/ui.jsx` | Todos os componentes primitivos |

---

## Dependências de Infraestrutura

Antes de qualquer fase de produto:

- [ ] Projeto Tauri 2.0 com Vite + React criado
- [ ] Rust toolchain instalado com targets Android e iOS
- [ ] Android SDK + NDK configurados
- [ ] Xcode instalado (para iOS build)
- [ ] Supabase project configurado (Auth, Postgres, Storage)
- [ ] Variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] RLS habilitado em todas as tabelas desde o início

---

## Fase 1 — Design System e Infraestrutura

**Objetivo:** base técnica e visual antes de qualquer tela.

- [ ] Tailwind v4 via PostCSS configurado com design tokens do protótipo V2
  - Cores: Midnight Ink, Electric Violet, Prompt Cyan, Solar Coral, Mint Signal
  - Fontes: Space Grotesk, Inter, JetBrains Mono (Google Fonts)
- [ ] CSS variables light/dark (tokens do V2)
- [ ] Dark mode toggle funcional
- [ ] Componentes primitivos: Icon, Avatar, Chip, Button, ProgressBar
- [ ] Animações CSS: fadeIn, slideUp, pop, screenFade
- [ ] Client Supabase client-side: `src/lib/supabase.ts`
- [ ] React Router Dom para navegação SPA
- [ ] Zustand para state management

**Referência:** `ui.jsx`, tokens CSS de `Promptys v2.html`

---

## Fase 2 — Autenticação

**Objetivo:** usuário consegue criar conta e fazer login.

- [ ] Signup com email/password (Supabase Auth)
- [ ] Login
- [ ] Logout
- [ ] Criação automática de `profile` via trigger no signup
- [ ] Proteção de rotas autenticadas via React Router + estado de autenticação Zustand/Context
- [ ] Página de onboarding L1 (1 slide, 1 botão)

**Sem:** OAuth social (pós-MVP), cadastro de interesses.

---

## Fase 3 — Feed L1

**Objetivo:** usuário consegue ver e copiar prompts.

- [ ] Schema Supabase: `promptys`, `prompty_likes`, `prompty_saves`
- [ ] Seed com 6 promptys mockados (do `data.jsx`)
- [ ] Feed page com cards L1 (estilo Facebook)
  - Avatar + nome + tempo
  - Texto do prompt (3 linhas + expandir)
  - Imagem de capa
  - Botão curtir + contagem
  - Botão "Copiar prompt" → estado "Copiado"
- [ ] Tab bar L1: 2 abas (Feed + Perfil)
- [ ] Header L1: logo + botão perfil

**Referência:** card L1 de `Promptys v2.html`, `BEGINNER_MODE_SPEC.md §3.3`

---

## Fase 4 — Gamificação Core (point_events)

**Objetivo:** pontos são registrados de forma segura e nível é calculado.

- [ ] Schema: `point_events` (imutável)
- [ ] Trigger SQL: cópia → +5p
- [ ] Trigger SQL: curtida → +1p (cap 10/dia)
- [ ] Trigger SQL: avaliação → +5p
- [ ] Trigger SQL: login diário → +2p (streak)
- [ ] Função `levelOf(points)` — cálculo de nível a partir dos thresholds
- [ ] Barra de progresso de nível no header/perfil

**Regra crítica:** nenhum frontend pode inserir em `point_events`.

---

## Fase 5 — Fluxo de Avaliação L1

**Objetivo:** loop principal de valor (copiar → avaliar → ganhar pontos).

- [ ] Schema: `prompty_tests` (rating, model, notes, image_url)
- [ ] Após cópia: banner "Cole no Gemini..."
- [ ] Modal de avaliação L1: apenas 5 estrelas + foto opcional
- [ ] Upload de imagem gerada (Supabase Storage)
- [ ] Ponto concedido via trigger após insert em `prompty_tests`

**Referência:** `BEGINNER_MODE_SPEC.md §3.5`, fluxo de cópia do V2

---

## Fase 6 — Perfil L1

**Objetivo:** usuário vê seu progresso de forma simplificada.

- [ ] Página de perfil L1: avatar, nome, "Você usou X promptys"
- [ ] Barra de progresso: "Falta pouco para desbloquear Buscar e Salvos"
- [ ] Lista de últimos promptys usados (thumbnails)
- [ ] Sem badges visuais, sem ranking, sem "seguindo"

---

## Fase 7 — Progressive Disclosure (L2 Desbloqueio)

**Objetivo:** ao cruzar 50p, usuário sente que cresceu.

- [ ] Detecção de mudança de nível ao carregar o app
- [ ] Modal LevelUpModal (animação `pop`)
- [ ] Tab bar L2: adiciona Buscar (3 abas)
- [ ] Aba Buscar funcional: categorias + trending + criadores
- [ ] Perfil L2: abas Progresso / Missões / Conquistas / Biblioteca
- [ ] Variáveis editáveis na tela de detalhe do Prompty
- [ ] Avaliação multi-dimensional ativada (5 dimensões)
- [ ] Biblioteca: Usados / Salvos

**Referência:** `SearchScreen`, `ProfileScreenV2` de `gamification.jsx`

---

## Fase 8 — Prompty Detail Completo (L2+)

**Objetivo:** tela de detalhe com todas as abas.

- [ ] Tela de detalhe com hero 360px
- [ ] Aba Inputs: campos editáveis por tipo + preview do prompt montado
- [ ] Aba Testes: galeria de testes da comunidade
- [ ] Aba Avaliações: médias por dimensão + lista
- [ ] `assembleFinalPrompt()`: `src/lib/prompty/template.ts`
- [ ] Compartilhar via Tauri command (share nativo por plataforma)

---

## Fase 9 — Criação de Prompty (L3)

**Objetivo:** usuários L3 podem publicar seus próprios prompts.

- [ ] Botão "+ Criar" aparece na tab bar ao atingir L3
- [ ] CreateScreen em 3 passos:
  - Passo 1: título, descrição, categoria, capa (upload)
  - Passo 2: textarea do template + dicas
  - Passo 3: resumo + publicação
- [ ] Insert em `promptys` + `prompty_versions` (version: 1)
- [ ] Trigger: publicação → +50p
- [ ] Prompty entra em "Em alta" por 24h

---

## Fase 10 — Ranking e Remix (L3)

**Objetivo:** competição e colaboração entre criadores.

- [ ] RankingsScreen: Semana / Mês / Geral
- [ ] Query semanal de pontos por `point_events` agrupados
- [ ] Remix: fork de um prompty com crédito ao original
  - Schema: `prompty_remixes`
  - Trigger: remix publicado → +25p para o remixador
- [ ] Aba Remixes na tela de detalhe

---

## Fase 11 — Missões e Badges

**Objetivo:** recorrência e retenção.

- [ ] Schema: tabela de missões com progresso por usuário
- [ ] Missões diárias e semanais com reset automático
- [ ] Grid de badges no perfil
- [ ] Trigger para cada badge (verificar `point_events` ou contadores)
- [ ] Notificação in-app ao desbloquear badge (Tauri notification command em mobile/desktop)

---

## Decisões de Implementação

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Componentes primitivos | Tailwind + React | Consistência com design system do protótipo |
| State management | Zustand | Sem servidor de estado no MVP |
| Upload de imagens | Supabase Storage | Integrado, sem custo extra no free tier |
| Realtime | Supabase Realtime | Para contadores de like em tempo real (pós-MVP) |
| Template parser | `replaceAll` simples | Sem dependência extra; handlebars-like |
| Dark mode | CSS variables | Mudança de classe no `<html>` |
| Fonts | Google Fonts CDN | Sem custo, carregamento rápido |
| Compartilhar | Tauri share command | Usa share sheet nativo por plataforma |

---

> **Deploy:** macOS/Windows/Linux via Tauri bundles (.dmg, .exe, .AppImage) + Android APK/AAB + iOS IPA. Sem deploy Vercel.
