# Phase 1: L1 Iniciante — Feed e Copiar — Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar a experiência L1 completa: qualquer visitante (logado ou anônimo) abre o app, vê o feed de promptys, copia um prompt com um toque, e pode voltar para avaliar. Usuários autenticados podem curtir e ter o progresso rastreado internamente. O sistema de gamificação existe no banco mas é **completamente invisível para o usuário L1**.

Esta fase inclui: schema Supabase completo, infraestrutura de auth, feed L1, fluxo de cópia, avaliação simples, perfil L1 mínimo, e engine de pontos/nível via triggers SQL.

Não inclui: busca, desbloqueio L2 com telas novas, criação de promptys, rankings, tela de detalhe avançada.

</domain>

<decisions>
## Implementation Decisions

### Sistema de Níveis (Gamificação)

- **5 níveis no schema, 3 com UX distintas no MVP**
  - L1 Explorador: 0–49p → 2 abas (Feed + Perfil)
  - L2 Curador: 50–249p → 3 abas (Feed + Buscar + Perfil) ← telas da Fase 2
  - L3 Criador: 250–999p → 5 abas (Feed + Buscar + Criar + Ranking + Perfil) ← Fase 3
  - L4 Mestre: 1.000p+ → sem telas novas no MVP (apenas número)
  - L5 Lendário: 5.000p+ → sem telas novas no MVP (apenas número)
- `profiles.level` aceita: `"L1"` | `"L2"` | `"L3"` | `"L4"` | `"L5"` — campo text na tabela
- Thresholds definidos como **constantes TypeScript**, não tabela de banco:
  ```typescript
  const LEVELS = [
    { id: "L1", name: "Explorador", min: 0,     color: "#22D3EE", emoji: "🌱" },
    { id: "L2", name: "Curador",    min: 50,    color: "#7C3AED", emoji: "✨" },
    { id: "L3", name: "Criador",    min: 250,   color: "#FF6B4A", emoji: "🎨" },
    { id: "L4", name: "Mestre",     min: 1000,  color: "#FFB020", emoji: "👑" },
    { id: "L5", name: "Lendário",   min: 5000,  color: "#EC4899", emoji: "🔮" },
  ]
  ```
- Função `levelOf(points: number)` exportada de `src/lib/constants/levels.ts`
- `profiles.points` e `profiles.level` são **colunas materializadas** — atualizadas por triggers SQL, nunca por código de aplicação

### Pontos e Triggers (Implementação Crítica)

Pontos concedidos EXCLUSIVAMENTE via triggers SQL em `point_events` (imutável). Nunca via frontend.

| Evento | Pontos | Limite | event_type |
|--------|--------|--------|------------|
| Copiar prompt | +5p | — | `copy` |
| Avaliar (uma vez por prompty) | +5p | 1 por prompty | `rate` |
| Curtir | +1p | 10/dia | `like` |
| Login diário / streak | +2p | 1/dia | `streak` |
| Publicar prompty | +50p | — | `publish` (Fase 3) |
| Remix aceito | +25p | — | `remix_accepted` (Fase 3) |

- `point_events` tem política RLS `WITH CHECK (false)` para roles `anon` e `authenticated` — **apenas triggers** (role `postgres`) inserem
- Unique constraint em `(user_id, event_type, ref_id)` — `ON CONFLICT DO NOTHING` para idempotência

### Schema do Banco (Completo desde Fase 1)

Todas as tabelas criadas na Fase 1 mesmo que algumas só sejam usadas em fases posteriores:

- **profiles** — extensão de `auth.users`, criada via trigger no signup. Campos: `id`, `username`, `name`, `avatar_url`, `level` (text, default 'L1'), `points` (int, default 0), `streak` (int, default 0), `verified` (boolean, default false), `created_at`
- **promptys** — `id`, `slug`, `title`, `description`, `author_id`, `template` (com {{variáveis}}), `negative`, `inputs_schema` (jsonb), `models` (text[]), `difficulty`, `style_tags` (text[]), `license`, `status` (draft/published/removed), `created_at`, `updated_at`
- **prompty_versions** — histórico imutável
- **prompty_tests** — registro de uso com imagem: `id`, `prompty_id`, `user_id`, `model`, `rating` (1–5), `notes`, `image_url`, `created_at`
- **prompty_ratings** — multi-dimensional (L2+): `visual_quality`, `prompt_accuracy`, `reproducibility`, `originality`, `model_compat` (todos numeric 3,2)
- **prompty_likes** — PK `(user_id, prompty_id)`
- **prompty_saves** — PK `(user_id, prompty_id)`
- **prompty_remixes** — `original_id`, `remix_id`
- **point_events** — `id`, `user_id`, `event_type`, `points`, `ref_id`, `created_at`

### Prompt no Card L1 (Estilo Facebook)

Estrutura exata do card L1 (de cima para baixo):
1. Header: avatar + nome do autor + tempo relativo (sem level badge, sem verificado)
2. Texto do prompt: **3 linhas truncadas + botão "Ver mais"** (texto completo do campo `template` com variáveis pré-preenchidas pelos valores default)
3. Imagem de capa: full-width
4. Linha de reações: curtir + contagem (sem compartilhar, sem comentar)
5. Botão primário: `[📋 Copiar prompt]`
6. Após cópia: botão vira `[✓ Copiado · avaliar]`

**O card é a experiência completa no L1 — não existe página de detalhe para L1.** Toque no card (fora do botão) não navega para nenhum lugar.

**O que NÃO aparece no card L1:** chips de modelo, dificuldade, versão, categoria, stats (saves/testes/avaliações), botões de remix/compartilhar.

### Prompt Resolvido para L1

O L1 vê o prompt com as **variáveis já substituídas pelos valores default** de `inputs_schema`. Não há formulário de variáveis no L1.

Lógica de resolução no frontend:
```typescript
function resolveBeginner(template: string, inputs_schema: InputField[]): string {
  return inputs_schema.reduce((acc, field) => {
    return acc.replaceAll(`{{${field.key}}}`, String(field.default ?? ''))
  }, template)
}
```

### Fluxo de Cópia (Loop Principal de Valor)

```
[📋 Copiar prompt]
  → clipboard.writeText(resolvedPrompt)
  → botão: [✓ Copiado · avaliar]
  → banner calmo (toast/banner): "Copiado. Cole no Gemini, ChatGPT ou Midjourney."
  → tap "avaliar" → bottom sheet / modal simples:
      "Funcionou bem?" → 5 estrelas
      upload foto opcional (image-slot web component)
      [Enviar +5p] → insert em prompty_tests → trigger concede +5p
```

O banner pós-cópia é calmo e não-intrusivo. Não bloqueia o feed.

### Acesso Anônimo vs Autenticado

- **Anônimo pode:** navegar feed + ler prompts + copiar prompt
- **Anônimo NÃO vê** (os elementos simplesmente não renderizam): botão curtir, botão avaliar, botão salvar, progresso de nível, perfil completo
- **Não há modal de login** ao copiar — cópia é livre
- Se anônimo tentar algo que requer auth (improvável no L1), redirecionar para `/login`

### Auth Flow

- Signup: email + password. **Sem OAuth no MVP**
- Trigger Supabase cria automaticamente o `profiles` row no signup
- Middleware Next.js: `updateSession()` em todas as rotas
- Session: rolling 7 dias via `@supabase/ssr`
- Onboarding L1 (apenas 1 slide, exibido uma vez):
  > "Promptys são receitas prontas para gerar imagens com IA. Toque numa, copie, cole no Gemini. Pronto."
  > `[Começar]` → feed
- Sem tour, sem cadastro de interesses

### Tab Bar L1

**2 abas** centradas: `Feed (home)` + `Perfil (user)`. Sem Buscar, sem Criar, sem Ranking.

Ao subir de nível, novos ícones **aparecem animados** na tab bar — não estavam cinza/desabilitados antes.

### Header L1

- Logo SVG "Promptys" à esquerda
- Badge do nível (L1 chip com cor `#22D3EE`) à direita
- **Sem:** PointsPill numérico, botão Criar, busca ativa (no L1 não tem busca)

### Perfil L1

- Avatar + nome + "@handle"
- "Você usou **X** promptys" (não "X pontos" — jargão evitado)
- Barra de progresso para próximo nível: "Falta pouco para desbloquear Buscar e Salvos"
- Grid de últimos promptys usados (thumbnails clicáveis para reusar o prompt)
- **Sem:** badges visuais, ranking de amigos, "seguindo", pontos como número

### Modal Level Up

- Ao cruzar threshold de nível: modal celebrativo (animação `pop: cubic-bezier(.2,1.4,.4,1)`)
- Mostrado 1 vez, dispensável
- Lista as funcionalidades desbloqueadas (L2: "Busca + Salvos + Seguir autores")
- CTA: "Continuar explorando"

**Regra de UX (absoluta):** em nenhum momento o usuário vê cadeado, feature desabilitada, ou botão cinza. O que não pode usar **simplesmente não é renderizado**.

### Design System

Implementar tokens CSS do protótipo V2 (`Promptys v2.html`):

**Light:**
```css
--bg: #FAF9F5; --surface: #FFFFFF; --surface-2: #F4F1EA;
--header-bg: rgba(250,249,245,0.92); --line: #E7E3DA;
--text-1: #181818; --text-2: #555; --text-3: #8A8784;
--primary: #7C3AED; --primary-soft: rgba(124,58,237,0.10);
--like: #FF3B6B;
```

**Dark:**
```css
--bg: #0E0F18; --surface: #161826; --surface-2: #1C1F30;
--header-bg: rgba(14,15,24,0.9); --line: #262A3C;
--text-1: #F4F5FA; --text-2: #B0B5C5; --text-3: #6D7388;
--primary: #9D6BFA; /* mais claro que #7C3AED para acessibilidade em dark */
--primary-soft: rgba(157,107,250,0.16); --like: #FF5C84;
```

Dark mode via CSS variables — mudança de classe no `<html>`.

**Animações CSS obrigatórias:**
- `fadeIn` — opacity 0→1
- `slideUp` — translateY(20px) + opacity
- `toastIn` — banner de cópia
- `pop` — modal level-up: `cubic-bezier(.2,1.4,.4,1)`
- `screenFade` — transição entre telas: `.25s cubic-bezier(.2,.8,.2,1)`

### Seed de Dados

6 promptys mockados do `data.jsx` devem ser seedados no banco para que o feed não esteja vazio. Os 6 promptys originais do protótipo:
1. Retrato Cinematográfico (intermediate)
2. Cartaz Editorial Y2K (beginner)
3. Brutalismo Solar (advanced)
4. Mascote Claymation (beginner)
5. Monograma Geométrico (intermediate)
6. Still de Comida 35mm (beginner)

Estes precisam ter `template` preenchido com o texto do prompt original do protótipo e `inputs_schema` com os valores default.

### Tweaks Panel (Dev/Staging Only)

- Componente de debug existente em `docs/planning/prototypes/components/tweaks-panel.jsx`
- Toggle dark/light mode
- Radio "Nível do usuário": L1 / L2 / L3 (força o nivel renderizado sem ganhar pontos)
- Padrão: `{ dark: false, level: "L1" }`
- **Nunca em produção** — renderizado apenas quando `NODE_ENV === 'development'` ou flag específica

### Copy Language (L1)

| ❌ Não usar | ✅ Usar |
|------------|--------|
| "prompt" (1ª menção) | "receita de imagem" |
| "remixar" | (não existe no L1) |
| "modelo" / "Midjourney" | "app de IA que você quiser" |
| "negative prompt" | (não existe no L1) |
| "+50p" | "Você desbloqueou +1 nível" |
| "v2.1" / "versão" | (não mostrar) |
| "rating breakdown" | "como ficou?" |
| "pontos" no perfil | "Você usou X promptys" |

### Monitoramento

- GitHub Actions weekly cron — Supabase Management API para uso de storage/bandwidth/connections
- Alert ao atingir 70% e 90% dos limites do free tier
- pgBouncer pooled connection URL (`SUPABASE_DB_URL`) para todas as queries — não a URL direta do Postgres

### Claude's Discretion

- Skeleton loading design dos cards
- Exato comportamento do banner pós-cópia (toast vs banner fixo no bottom)
- Comportamento do "Ver mais" no texto do prompt (expand inline vs modal)
- Compressão de imagem no upload de resultado (client-side, target ≤200 KB WebP)
- Tratamento de erros de auth (mensagens de erro de signup/login)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protótipos (Fontes Canônicas de UI e Comportamento)
- `docs/planning/prototypes/Promptys v2.html` — **Spec principal do MVP** (progressive disclosure). Implementação de referência para card L1, fluxo de cópia, tokens CSS V2, tab bar progressiva, modal level-up
- `docs/planning/prototypes/Promptys.html` — Spec de referência para telas avançadas (L3). Não implementar agora — usar como visão futura
- `docs/planning/prototypes/BEGINNER_MODE_SPEC.md` — Regras detalhadas de progressive disclosure por nível, copy language, métricas de sucesso

### Componentes do Protótipo (Implementar como Referência)
- `docs/planning/prototypes/ui.jsx` — Todos os componentes primitivos: Icon, Avatar, Chip, Button, ProgressBar, etc.
- `docs/planning/prototypes/gamification.jsx` — **Modelo canônico de 5 níveis** (usar este, não o data.jsx). ProfileScreenV2, LevelUpModal, MissionsScreen, BadgesGrid
- `docs/planning/prototypes/data.jsx` — Mock data: 6 promptys + 7 usuários para seed. Schema dos dados mockados
- `docs/planning/prototypes/screens-feed.jsx` — Implementação de referência do FeedScreen e FeedCard
- `docs/planning/prototypes/screens-prompty.jsx` — Implementação de referência do PromptyScreen (para referência futura)
- `docs/planning/prototypes/components/tweaks-panel.jsx` — Painel de debug (dev/staging only)
- `docs/planning/prototypes/components/ios-frame.jsx` — Frame iOS para desenvolvimento/staging

### Documentação do Produto
- `docs/features/beginner-mode.md` — Spec completa do modo L1: card structure, copy flow, profile L1, copy language
- `docs/features/feed.md` — Abas do feed, estrutura do card (L1 vs advanced), interações
- `docs/features/gamification.md` — Níveis L1–L5, economia de pontos, badges, missões (usar `gamification.jsx` como canônico)
- `docs/design/design-system.md` — Paleta, tipografia, componentes, border radius, sombras, animações
- `docs/data/data-model.md` — Schema Supabase completo, RLS, mock data
- `docs/screens/navigation.md` — Estrutura de telas por nível, tab bar, onboarding, modais

### Planning Context
- `.planning/PROJECT.md` — Visão, princípios, modelo de progressão L1/L2/L3
- `.planning/REQUIREMENTS.md` — Requirements IDs: AUTH-01–05, FEED-01–05, SOCL-01–03, PROF-01–03, LEVL-01–07, INFR-01–05
- `.planning/ROADMAP.md` — Fase 1 goal e success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/planning/prototypes/ui.jsx` — Componentes React completos (Icon, Avatar, Chip, Button, ProgressBar) para portar para Tailwind/shadcn. Usar como spec visual, não copiar código diretamente (são React inline sem TypeScript)
- `docs/planning/prototypes/components/image-slot.js` — Web component para upload de imagem (drag-drop + tap). Pode ser usado como referência para o componente de upload de resultado
- CSS animations e tokens já definidos nos HTML protótipos — portar para globals.css e tailwind.config

### Established Patterns (a Estabelecer na Fase 1)

Os padrões abaixo ainda não existem em código — esta fase os estabelece. Fases subsequentes os herdam.

- **Supabase client split:** `src/lib/supabase/server.ts` (createServerClient por request) + `src/lib/supabase/browser.ts` (createBrowserClient singleton). NUNCA usar `@supabase/auth-helpers-nextjs` — está depreciado
- **Level resolver:** `src/lib/constants/levels.ts` com array `LEVELS` e função `levelOf(points)`
- **Prompt resolver:** `src/lib/prompty/template.ts` com `resolveBeginner()` para L1
- **Image compression:** `src/lib/images/compress.ts` antes de qualquer upload
- **CSS variables:** definidas em `src/app/globals.css`, aplicadas via classe `dark` no `<html>`

### Integration Points

- Middleware Next.js → `@supabase/ssr` `updateSession()` em todas as rotas
- Trigger Supabase → cria `profiles` automaticamente no signup (`auth.users → profiles`)
- SQL triggers → `prompty_tests` INSERT → `point_events` INSERT → `profiles.points` UPDATE
- Tab bar → lê `profile.level` do Supabase Auth session para decidir quais abas renderizar

</code_context>

<specifics>
## Specific Ideas

- Card L1 "estilo Facebook" — layout vertical simples, não grid 2 colunas. Sem densidade, sem chips técnicos. A identidade visual é clean, não tech.
- Banner pós-cópia deve ser calmo: "Copiado. Cole no Gemini, ChatGPT ou Midjourney. Quando voltar, conte como ficou." — sem urgência, sem call-to-action agressivo
- Progress bar no perfil L1 usa linguagem de funcionalidades, não pontos: "Falta pouco para desbloquear Buscar e Salvos" — o usuário não sabe quantos pontos faltam
- TweaksPanelDev existe no protótipo e deve ser portado para staging — permite stakeholders ver L1/L2/L3 sem precisar ganhar pontos reais
- O feed L1 é cronológico sem abas — primeiro card visível é o mais recente. Nada de algoritmo ou "Em alta" no L1
- Dark mode implementado desde o início (toggle no painel de tweaks e header). V2 tem tokens diferentes do V1 para dark — usar V2

</specifics>

<deferred>
## Deferred Ideas

- Filtros de feed por categoria/modelo → Phase 2 (FEED-06, FEED-07)
- Desbloqueio L2 com telas novas (Busca, Salvos) → Phase 2
- Avaliação multi-dimensional (5 dimensões) → Phase 2
- Variáveis editáveis na tela de detalhe → Phase 2
- Tela de detalhe completa com abas → Phase 2
- Modal LevelUp com lista de features desbloqueadas → implementar agora, mas as features listadas (Busca, Salvos) são da Phase 2
- Badges visuais no perfil → Phase 2+
- Missões diárias/semanais → Phase 2+
- Criação de prompty (L3) → Phase 3
- Rankings → Phase 3
- Remix → Phase 3

</deferred>

---

*Phase: 01-l1-iniciante-feed-e-copiar*
*Context gathered: 2026-05-07*
