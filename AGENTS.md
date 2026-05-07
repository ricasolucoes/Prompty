# AGENTS.md — Promptys

Guia de arquitetura e regras de domínio para agentes de IA trabalhando neste repositório.
Mantido em sincronia com `CLAUDE.md` — atualize os dois no mesmo commit.

## Visão Geral

**Promptys** é uma rede social colaborativa para criar, compartilhar, remixar e avaliar prompts de geração de imagens.

- **Stack:** Vite + React (SPA) + Tauri 2.0 (desktop + Android + iOS) + Supabase (Auth, Postgres, Storage, Realtime, RLS)
- **Deploy:** Tauri bundles nativos (.dmg, .exe, .AppImage, APK/AAB, IPA). Sem Vercel.
- **MVP:** Sem backend próprio, sem geração de imagens inline

---

## Mapa de Responsabilidades

| Camada | Onde | Responsabilidade |
|--------|------|-----------------|
| Rotas/Páginas | `src/pages/` ou `src/routes/` | Telas do SPA gerenciadas pelo React Router |
| Componentes | `src/components/` | UI por domínio; não fazem fetch direto |
| Hooks | `src/hooks/` | Estado e efeitos; acesso a dados via Supabase JS SDK |
| Store | `src/store/` | Estado global via Zustand |
| Lib / Utils | `src/lib/` | Supabase client único, helpers, template parser |
| Tipos | `src/types/` | Tipos TypeScript de domínio + `database.types.ts` gerado |
| Tauri Commands | `src-tauri/src/commands/` | Funcionalidades nativas expostas ao frontend via invoke |

---

## Regras Críticas

### Supabase
- Cliente único, client-side: `src/lib/supabase.ts` — use em todos os hooks e componentes.
- **Nunca** use `service_role` key no frontend.
- **Nunca** modifique `point_events` diretamente — pontos são gerenciados por triggers SQL.
- RLS está ativo em todas as tabelas; testes devem respeitar isso.

### Templates
- Parse e render de `{{variavel}}` têm fonte única em `src/lib/prompty/template.ts`.
- `inputs_schema` define os tipos de variável: `text | image | enum | number | boolean | color | ratio | seed`.

### Tauri Commands
- Commands são a única forma de acessar APIs nativas: share, secure storage (keychain), notificações push, deep links, acesso ao sistema de arquivos.
- **Nunca** use Tauri commands para lógica que o Supabase JS SDK já resolve (queries, auth, storage de arquivos de usuário).
- Todos os commands ficam em `src-tauri/src/commands/`; cada domínio em seu próprio módulo.
- Tipos gerados via `ts-rs` ficam em `src/types/generated/` — nunca edite esses arquivos manualmente.
- No frontend, acione commands com `invoke('command_name', { args })` — sem `window.fetch` direto para APIs externas.

### Moderação
- Dados de denúncias e status de moderação nunca expostos para usuários não-admin.
- Conteúdo proibido: adulto explícito, deepfakes enganosos, prompts para conteúdo ilegal.

---

## Comandos Principais

```bash
npm run dev          # Servidor de desenvolvimento (Vite)
npm run tauri dev    # App Tauri em modo desenvolvimento
npm run build        # Build Vite
npm run tauri build  # Build Tauri para plataforma atual
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
