# AGENTS.md — Promptys

Guia de arquitetura e regras de domínio para agentes de IA trabalhando neste repositório.
Mantido em sincronia com `CLAUDE.md` — atualize os dois no mesmo commit.

## Visão Geral

**Promptys** é uma rede social colaborativa para criar, compartilhar, remixar e avaliar prompts de geração de imagens.

- **Stack:** Next.js (App Router) + Supabase (Auth, Postgres, Storage, Realtime, RLS)
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)
- **MVP:** Sem backend próprio, sem geração de imagens inline

---

## Mapa de Responsabilidades

| Camada | Onde | Responsabilidade |
|--------|------|-----------------|
| Rotas/Páginas | `src/app/**` | Composição de layout, fetch de dados em Server Components |
| Componentes | `src/components/**` | UI por domínio; não fazem fetch direto |
| Hooks | `src/hooks/**` | Estado e efeitos do cliente; um hook por domínio |
| Lib / Utils | `src/lib/**` | Supabase clients, helpers, template parser |
| Tipos | `src/types/**` | Tipos TypeScript de domínio + `database.types.ts` gerado |
| Server Actions | `src/actions/**` | Mutations autenticadas e lógica server-side |

---

## Regras Críticas

### Supabase
- Client do browser: `src/lib/supabase/client.ts` — use em Client Components e hooks.
- Client server-side: `src/lib/supabase/server.ts` — use em Server Components, Actions e Route Handlers.
- **Nunca** use `service_role` key no frontend.
- **Nunca** modifique `point_events` diretamente — pontos são gerenciados por triggers SQL.
- RLS está ativo em todas as tabelas; testes devem respeitar isso.

### Templates
- Parse e render de `{{variavel}}` têm fonte única em `src/lib/prompty/template.ts`.
- `inputs_schema` define os tipos de variável: `text | image | enum | number | boolean | color | ratio | seed`.

### Server vs. Client Components
- Padrão: Server Component.
- `"use client"` apenas quando houver interatividade, hooks do browser, ou estado local necessário.
- Data fetching em Server Components; mutações em Server Actions ou Route Handlers.

### Moderação
- Dados de denúncias e status de moderação nunca expostos para usuários não-admin.
- Conteúdo proibido: adulto explícito, deepfakes enganosos, prompts para conteúdo ilegal.

---

## Comandos Principais

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npm run test         # Testes
npm run test:coverage # Cobertura
```

Consulte `.claude/commands/commands.yaml` para a lista completa com sinais de sucesso/falha.

---

## Identidade Visual (não alterar sem aprovação)

| Token | Valor |
|-------|-------|
| Midnight Ink | `#090A14` |
| Electric Violet | `#7C3AED` |
| Prompt Cyan | `#22D3EE` |
| Solar Coral | `#FF6B4A` |
| Mint Signal | `#34D399` |

Fontes: **Space Grotesk** (logo/headings) · **Inter** (UI) · **JetBrains Mono** (blocos de prompt)

---

## Gamificação — Regra Inviolável

Pontos são concedidos **exclusivamente** via triggers SQL e a tabela `point_events` (imutável).
Nenhum agent deve propor ou implementar concessão de pontos pelo frontend ou por insert direto na tabela de pontos de perfil.
