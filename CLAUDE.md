# Claude Rules — Promptys

## Arquitetura Next.js

- `src/app/**` contém rotas e layouts (App Router). Cada pasta de rota exporta `page.tsx` e `layout.tsx` quando necessário.
- `src/components/**` contém UI por domínio (ex: `feed/`, `prompty/`, `profile/`, `ui/`). Componentes não fazem fetch direto — delegam a hooks ou Server Components.
- `src/lib/**` centraliza clients (Supabase), helpers e utils reutilizáveis.
- `src/hooks/**` contém React hooks de domínio; não duplique lógica de estado que já existe num hook.
- `src/types/**` centraliza tipos TypeScript; nunca defina tipos inline em componentes quando pertencerem ao domínio.

## Supabase

- O client do browser fica em `src/lib/supabase/client.ts`; o server-side em `src/lib/supabase/server.ts`. Nunca importe o client errado (browser em Server Components ou vice-versa).
- RLS está habilitado em todas as tabelas — nunca contorne com `service_role` no frontend.
- Operações que mudam pontos de gamificação só acontecem via triggers SQL e a tabela `point_events` — nunca via insert/update direto do frontend.
- Mutations que requerem autenticação devem ser feitas em Server Actions ou Route Handlers, não em client components.

## Templates de Prompty

- A sintaxe de template é `{{variavel}}` com schema `inputs_schema` (JSONB). A função de parse/render de variáveis tem fonte única em `src/lib/prompty/template.ts`.
- Nunca duplique a lógica de detecção de variáveis em componentes de UI.

## Estilo e Design System

- Cores do projeto: Midnight Ink `#090A14`, Electric Violet `#7C3AED`, Prompt Cyan `#22D3EE`, Solar Coral `#FF6B4A`, Mint Signal `#34D399`.
- Fontes: Space Grotesk (logo/headings), Inter (UI), JetBrains Mono (blocos de prompt).
- Tailwind é a única forma de estilização — sem CSS Modules ou styled-components.

## Regras Gerais

- Server Components por padrão; `"use client"` só quando necessário (interatividade, hooks do browser).
- Sem backend próprio no MVP — Supabase é a única infraestrutura de backend.
- Moderação e conteúdo: nunca exponha dados de denúncias ou status de moderação para usuários não-admin.
- Quando estas regras mudarem, atualize `AGENTS.md` e `CLAUDE.md` no mesmo commit.
