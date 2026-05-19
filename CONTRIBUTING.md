# Contribuir com Promptys

Obrigado por considerar contribuir. Promptys é AGPL-3.0 — quando você abre um PR, você concorda em licenciar sua contribuição sob a mesma licença.

## Antes de começar

- **Bug**: abra uma [issue de bug](https://github.com/ricasolucoes/Prompty/issues/new?template=bug_report.md) com reprodução clara antes do PR
- **Feature pequena** (≤50 linhas, sem schema change): PR direto, OK
- **Feature grande / schema / breaking change**: abra uma [issue de proposta](https://github.com/ricasolucoes/Prompty/issues/new?template=feature_request.md) primeiro pra alinhar
- **Segurança**: leia [SECURITY.md](SECURITY.md), não abra issue pública

## Setup do ambiente

Veja [README.md § Desenvolvimento](README.md#desenvolvimento). Resumo:

```bash
git clone https://github.com/ricasolucoes/Prompty.git
cd Prompty
cp .env.example .env.local   # preencha Supabase URL/key
pnpm install
pnpm dev                      # webapp dev
pnpm quality:all              # validar antes de commit
```

## Fluxo de PR

1. **Fork** do repo (ou branch direto se você é colaborador)
2. **Branch nomeada**: `feat/...`, `fix/...`, `docs/...`, `chore/...`, `refactor/...`
3. **Commits** em formato Conventional Commits:
   ```
   feat(scope): adicionar X
   fix(scope): corrigir Y
   docs(scope): explicar Z
   chore(ci): atualizar W
   ```
   Mantenha o título curto (≤70 chars). Detalhes no corpo da mensagem.
4. **Tests** — escreva ou atualize testes para o que você mudou. Falhar localmente → não abra PR.
5. **Quality gate** — `pnpm quality:all` precisa passar limpo (CI vai validar de novo).
6. **PR description** — preencha o template, marque a checklist, vincule a issue se houver.

## Padrões de código

- **TypeScript estrito** — `strict: true`, sem `any` (use `unknown` + guards)
- **Componentes React** — funcionais, props imutáveis (`Readonly<>`), sem fetch direto (use hooks)
- **Estilização** — inline styles é o padrão atual (estabelecido na Phase 1); Tailwind para utilitários OK. Sem CSS Modules ou styled-components.
- **Supabase** — RLS sempre ligado, nunca contornar com `service_role` no frontend
- **Templates** — lógica de parse/render de variáveis `{{var}}` mora em `src/lib/prompty/template.ts`, não duplique em componentes
- **Tauri nativo** — qualquer acesso a APIs do dispositivo (share, notificações, keychain, deep links) usa `tauri invoke`, nunca `window.fetch` direto

## Camadas

Não pule camadas:

```
UI (components/) → hooks/ → lib/supabase ou tauri-api
```

Componentes não chamam `supabase` direto. Hooks são o único lugar onde queries acontecem.

## Migrations Supabase

```bash
# Criar migration nova
supabase migration new feature_x

# Regenerar tipos depois de aplicar
pnpm gen:types
```

Não edite migrations já aplicadas — crie uma nova migration que corrige.

## CHANGELOG

Mudanças visíveis aos usuários (features, fixes, breaking) precisam de uma linha no `CHANGELOG.md` sob `[Unreleased]`, no formato:

```markdown
### ✨ Novidades
- [x] **Nome da feature** — descrição curta

### 🐛 Correções
- [x] Fix descrição
```

## Code review

- Mantenha PRs pequenos (<300 linhas modificadas idealmente)
- Responda revisões em ≤48h ou avise se vai demorar
- "Approved" não significa merge automático — o autor do PR faz o merge

## Releases

Releases são feitas pela equipe core via tag `v*.*.*` no branch `master`. O workflow `build-release.yml` builda automaticamente macOS/Windows/Linux/Android/iOS e anexa ao GitHub Release.

## Dúvidas

Abra uma issue com label `question` ou comente no Discussions (em breve).
