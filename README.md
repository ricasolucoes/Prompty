<div align="center">

# Promptys

**Biblioteca visual de prompts prontos para geração de imagens com IA.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Quality Gates](https://github.com/ricasolucoes/Prompty/actions/workflows/quality.yml/badge.svg?branch=master)](https://github.com/ricasolucoes/Prompty/actions/workflows/quality.yml)
[![Release](https://img.shields.io/github/v/release/ricasolucoes/Prompty?include_prereleases)](https://github.com/ricasolucoes/Prompty/releases/latest)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

[Download](https://github.com/ricasolucoes/Prompty/releases/latest) ·
[Contribuir](CONTRIBUTING.md) ·
[Reportar bug](https://github.com/ricasolucoes/Prompty/issues/new?template=bug_report.md) ·
[Code of Conduct](CODE_OF_CONDUCT.md)

</div>

---

## O que é

Promptys é uma biblioteca visual e gratuita de prompts prontos para geração de imagens com IA. A experiência inicial é simples: ver uma imagem de exemplo, ler um prompt pronto, copiar e colar no Gemini ou outro app de geração. A complexidade — gamificação, criação, remix, variáveis avançadas — fica escondida e é desbloqueada progressivamente conforme o engajamento real do usuário.

**Mais que texto:** um Prompty é um template versionado com variáveis (`{{var}}`), testes reais da comunidade e ranking que prova quais prompts funcionam em diferentes modelos de IA.

## Como funciona — progressão L1 → L2 → L3

| Nível | Quem | O que faz |
|---|---|---|
| **L1 Iniciante** | Visitantes e novos usuários | Ver feed, copiar prompt pronto, colar no Gemini |
| **L2 Curador** | Usuários engajados | Buscar, salvar favoritos, avaliar promptys, enviar imagens geradas, sugerir categorias, denunciar |
| **L3 Criador** | Top usuários | Criar promptys com wizard de 4 passos, templates com `{{variáveis}}`, criar variações, ver estatísticas |

A interface esconde features avançadas até o usuário se qualificar (gating por pontos). Sem botões mortos, sem opções esmaecidas — quem está no L1 nem sabe que existe ranking.

## Plataformas suportadas

| Plataforma | Status | Onde baixar |
|---|---|---|
| macOS Apple Silicon (ARM64) | ✅ Estável | [Latest release](https://github.com/ricasolucoes/Prompty/releases/latest) |
| macOS Intel (x86_64) | ✅ Estável | Latest release (via CI tag push) |
| Windows | ✅ Estável | Latest release |
| Linux (AppImage / .deb) | ✅ Estável | Latest release |
| Android | ✅ Estável (unsigned/signed) | Latest release |
| iOS | 🚧 Em breve (precisa Apple Developer signing) | — |

## Stack técnica

- **Frontend**: Vite 6 + React 19 + TypeScript estrito + Zustand + React Router 7
- **Backend**: Supabase (Postgres + Auth + Storage + RLS + triggers SQL)
- **Native shell**: Tauri 2.0 (Rust)
- **Testes**: Vitest + Testing Library
- **Quality**: ESLint v9 (flat config) + Prettier + SonarJS + jscpd + cargo clippy/audit

## Desenvolvimento

### Pré-requisitos

- Node.js 22+
- pnpm 9+ (ou 10+)
- Rust stable (`rustup`)
- Supabase CLI (para regenerar tipos)
- Para mobile: Android Studio (Android), Xcode (iOS)

### Setup local

```bash
# Clone
git clone https://github.com/ricasolucoes/Prompty.git
cd Prompty

# Variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Instalar dependências
pnpm install

# Rodar webapp (dev)
pnpm dev

# Rodar Tauri desktop (dev)
pnpm dev:tauri

# Rodar Tauri mobile
pnpm dev:tauri:android
pnpm dev:tauri:ios
```

### Build

```bash
# Frontend web only
pnpm build

# Desktop nativo
pnpm build:tauri

# Mobile
pnpm build:android
pnpm build:ios
```

### Qualidade

```bash
# Pipeline completo (CI replicada localmente)
pnpm quality:all

# Steps individuais
pnpm format:check
pnpm lint
pnpm type-check
pnpm test:run
pnpm cpd          # detecção de código duplicado
pnpm rust:clippy
pnpm rust:test
pnpm rust:audit
```

## Arquitetura

- `src/` — frontend Vite + React (SPA, sem SSR)
- `src/pages/` — rotas gerenciadas pelo React Router
- `src/components/` — UI por domínio (`feed/`, `prompty/`, `profile/`, `ui/`). Componentes não fazem fetch direto — delegam a hooks.
- `src/hooks/` — hooks de domínio e acesso a dados via Supabase JS SDK
- `src/lib/supabase.ts` — cliente único do Supabase (client-side only)
- `src/lib/prompty/template.ts` — parser de template `{{variavel}}`
- `src/store/` — estado global via Zustand
- `src/types/` — tipos TypeScript + `database.types.ts` gerado pelo Supabase
- `src-tauri/src/` — código Rust/Tauri (comandos nativos)
- `supabase/migrations/` — migrations versionadas

Detalhes em [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md).

## Roadmap

v1.0 — MVP entregue (L1 + L2 + L3). Próximas direções:

- v1.1 — Ranking real (atualmente placeholder), badges, gamificação visível em área separada
- v1.2 — Modo avançado completo (presets, prompt negativo, testes comparativos lado-a-lado)
- v1.3 — Marketplace / monetização para criadores top

Veja [issues abertas](https://github.com/ricasolucoes/Prompty/issues) e [CHANGELOG.md](CHANGELOG.md).

## Contribuir

Contribuições são bem-vindas. Comece por:

1. Ler [CONTRIBUTING.md](CONTRIBUTING.md)
2. Buscar issues marcadas com `good first issue` ou `help wanted`
3. Discutir mudanças grandes em uma issue antes de abrir PR

## Comunidade e suporte

- **Bugs**: [abra uma issue](https://github.com/ricasolucoes/Prompty/issues/new?template=bug_report.md)
- **Features**: [feature request](https://github.com/ricasolucoes/Prompty/issues/new?template=feature_request.md)
- **Vulnerabilidades**: leia [SECURITY.md](SECURITY.md) — não abra issue pública

## Licença

[AGPL-3.0](LICENSE) — copyleft forte. Usos hospedados (SaaS) que modificam o código precisam disponibilizar o código fonte modificado aos usuários. Uso pessoal, comercial interno e contribuições upstream são livres.

Direitos autorais © 2026 Rica Soluções e contribuidores.
