# Claude Rules — Promptys

## Arquitetura Vite + React + Tauri 2.0

- `src/` — frontend Vite + React (SPA, sem SSR).
- `src/pages/` ou `src/routes/` — telas/rotas gerenciadas pelo React Router.
- `src/components/` — UI por domínio (`feed/`, `prompty/`, `profile/`, `ui/`). Componentes não fazem fetch direto — delegam a hooks.
- `src/hooks/` — hooks de domínio e acesso a dados via Supabase JS SDK; não duplique lógica de estado que já existe num hook.
- `src/lib/supabase.ts` — cliente único do Supabase (client-side only, sem server). Único ponto de importação do client.
- `src/lib/prompty/template.ts` — parser de template `{{variavel}}`; fonte única da lógica de parse/render.
- `src/store/` — estado global via Zustand.
- `src/types/` — tipos TypeScript de domínio + `database.types.ts` gerado pelo Supabase CLI.
- `src-tauri/src/` — código Rust/Tauri; contém apenas comandos nativos.
- `src-tauri/src/commands/` — Tauri commands expostos ao frontend (auth seguro, share, storage nativo, notificações, deep links).

## Supabase

- O cliente Supabase é client-side only: `src/lib/supabase.ts`. Não existe client server-side neste projeto.
- RLS está habilitado em todas as tabelas — nunca contorne com `service_role` no frontend.
- Operações que mudam pontos de gamificação só acontecem via triggers SQL e a tabela `point_events` — nunca via insert/update direto do frontend.
- Mutations do frontend vão direto via `supabase-js` (com RLS protegendo os dados).

## Templates de Prompty

- A sintaxe de template é `{{variavel}}` com schema `inputs_schema` (JSONB). A função de parse/render de variáveis tem fonte única em `src/lib/prompty/template.ts`.
- Nunca duplique a lógica de detecção de variáveis em componentes de UI.

## Estilo e Design System

- Cores do projeto: Midnight Ink `#090A14`, Electric Violet `#7C3AED`, Prompt Cyan `#22D3EE`, Solar Coral `#FF6B4A`, Mint Signal `#34D399`.
- Fontes: Space Grotesk (logo/headings), Inter (UI), JetBrains Mono (blocos de prompt).
- Estilização via inline styles (`style={{ }}`) é o padrão estabelecido em produção (Phase 1). Não use CSS Modules ou styled-components. Tailwind pode ser usado para utilitários de layout/espaçamento quando conveniente, mas não é obrigatório.

## Regras Gerais

- Sem SSR, sem Server Components, sem Server Actions — este é um SPA puro.
- Acesso a APIs nativas (share, notificações, keychain, deep links) deve usar `tauri invoke` — Tauri commands são a única forma de acessar funcionalidades nativas do dispositivo.
- Sem `window.fetch` direto para APIs externas — use o supabase client ou Tauri invoke.
- Sem backend próprio no MVP — Supabase é a única infraestrutura de backend.
- Moderação e conteúdo: nunca exponha dados de denúncias ou status de moderação para usuários não-admin.
- Quando estas regras mudarem, atualize `AGENTS.md` e `CLAUDE.md` no mesmo commit.
