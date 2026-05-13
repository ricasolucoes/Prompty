# Phase 2: L2 Curador + Descoberta - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Usuários que atingiram L2 (Curador) desbloqueiam três grupos de funcionalidades:

1. **Curadoria ativa** — envio de imagem gerada como resultado (CUR-01), com nota opcional; avaliação de qualidade via estrelas na RateSheet expandida (CUR-02).
2. **Biblioteca pessoal** — nova aba "Salvos" no TabBar com histórico de cópias, saves e resultados enviados, filtráveis (CUR-03); sugestão de categoria (CUR-04); denúncia de conteúdo (CUR-05).
3. **Descoberta** — aba "Buscar" no TabBar com campo de texto + chips de filtro por categoria e modelo recomendado (FEED-06, FEED-07); resultados paginados.

Moderação pelo admin é via Supabase Dashboard (sem painel no app no MVP). Promptys flagados/removidos somem do feed e da detail page para não-admins (MODR-03).

Esta fase não inclui: criação de promptys (Phase 3), ranking, editor avançado, notificações, follow system.

</domain>

<decisions>
## Implementation Decisions

### Submissão de resultado (CUR-01)
- RateSheet **expandida** para L2: mantém as estrelas existentes e adiciona um campo de upload de imagem + nota de texto opcional — tudo no mesmo fluxo
- Upload imediato, sem aprovação manual; admin pode remover depois via Supabase Dashboard
- Os resultados enviados aparecem em uma seção **"Resultados da comunidade"** na PromptyDetailPage, abaixo do conteúdo principal, como galeria de imagens
- O `useTest.ts` existente (compressão WebP + upload para Storage) deve ser reutilizado para o upload do resultado

### Avaliação de qualidade (CUR-02)
- Combinado com CUR-01 no mesmo fluxo da RateSheet: estrelas + upload de imagem + nota no mesmo envio
- Não é um fluxo separado — o usuário L2 não vê dois botões diferentes

### Histórico e biblioteca pessoal (CUR-03)
- Nova aba **"Salvos"** no TabBar, desbloqueada para L2+ (aparece entre Feed e Buscar)
- TabBar L2: **Feed | Salvos | Buscar | Perfil**
- A aba Salvos mostra: saves (bookmarks) + cópias + resultados enviados, com sub-filtros em chips (Salvos / Cópias / Resultados)
- Layout: grid de cards compactos 3 colunas (mesmo padrão do grid de recentes do ProfilePage)

### Sugestão de categoria (CUR-04)
- Claude's discretion: formulário simples no menu "..." da PromptyDetailPage, campo de texto livre ou select de categorias existentes

### Denúncia de conteúdo (CUR-05, MODR-01)
- Botão "..." no canto da PromptyDetailPage abre um bottom sheet com opções: Denunciar, Sugerir categoria
- Sheet de denúncia: dropdown de categoria (conteúdo impróprio / spam / plagiado / outro) + botão confirmar
- Submissão insere row em tabela `reports`; sem feedback visual elaborado além de toast de confirmação

### Moderação pelo admin (MODR-02, MODR-03)
- Admin modera via **Supabase Dashboard** diretamente — sem painel no app no MVP
- Campo `is_admin` no perfil controla visibilidade futura de ferramentas admin (não usado no frontend agora)
- Promptys com `status = 'flagged' | 'hidden' | 'removed'` são filtrados nas queries do feed e da detail page (MODR-03)

### Filtros e busca (FEED-06, FEED-07)
- Aba **"Buscar"** no TabBar para L2+ (confirma o protótipo `Promptys v2.html`)
- Conteúdo da aba: campo de busca por texto no topo + chips filträveis por categoria e `recommended_model` abaixo + resultados paginados
- Busca full-text via Postgres `to_tsvector` / `to_tsquery` nas colunas `title`, `description`, `style_tags`
- Filtros de categoria e modelo funcionam mesmo sem texto digitado (browsing por categoria)

### Claude's Discretion
- Design visual da seção "Resultados da comunidade" na PromptyDetailPage (grid, tamanho das thumbnails)
- Ícone e label da aba Salvos (bookmark ou coração cheio)
- Estado vazio de cada sub-filtro na aba Salvos
- Implementação dos chips de filtro na aba Buscar (scroll horizontal ou wrap)
- Debounce do campo de busca (300ms recomendado)
- Esquema de pontos para CUR-01/CUR-02 — se enviar resultado ganha pontos, qual trigger SQL

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protótipo de referência (fonte de verdade visual e de navegação)
- `docs/planning/prototypes/Promptys v2.html` — TabBar progressivo (L2 = Feed | Buscar | Perfil base; esta fase adiciona Salvos), RateSheet com upload de imagem, LevelUpModal, padrão de cores e layout. Toda decisão de UX deve ser consistente com este protótipo.

### Requisitos e roadmap
- `.planning/REQUIREMENTS.md` — CUR-01 a CUR-05, MODR-01 a MODR-03, FEED-06, FEED-07 (definições formais de cada requisito)
- `.planning/ROADMAP.md` — Phase 2 goal e success criteria

### Contexto da fase anterior (padrões estabelecidos)
- `.planning/phases/01-foundation/01-CONTEXT.md` — decisões travadas da Phase 1: LEVL-06 (nenhum feature como botão morto), LEVL-07 (progressividade), estrutura do TabBar, padrão de hooks, regra de RLS

### Código existente a reutilizar ou estender
- `src/hooks/useTest.ts` — upload de imagem com compressão WebP (reutilizar para CUR-01)
- `src/components/feed/RateSheet.tsx` — bottom sheet a ser expandido com upload para L2
- `src/components/layout/TabBar.tsx` — adicionar abas Salvos e Buscar com minLevel L2
- `src/hooks/useFeed.ts` — cursor pagination (estender com params de busca e filtro)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTest.ts`: já comprime imagem para WebP (≤200KB) e faz upload para `supabase.storage.from('prompty-results')`. Reutilizar para o upload de resultado da seção CUR-01 — não duplicar a lógica.
- `RateSheet.tsx`: bottom sheet com estrelas + slot de imagem (o protótipo já mostra "Anexar imagem (opcional)"). Expandir para L2 com exibição condicional do campo baseada em `user.level`.
- `useSave.ts`, `useLike.ts`: padrão de hook otimista estabelecido — novos hooks de curadoria devem seguir o mesmo padrão.
- `FeedCard.tsx`: componente de card do feed — reutilizar na tela de busca para exibir resultados.
- `PromptyDetailPage.tsx`: hub central para ações por-prompty; é aqui que vai a galeria de resultados, o menu "..." e o botão de denúncia.
- `LevelUpModal.tsx`: já contém a lista de desbloqueios L2 atualizada (incluindo "Avaliar Promptys e enviar imagens geradas").

### Established Patterns
- Hooks de domínio em `src/hooks/` — sem fetch direto nos componentes
- Cursor pagination via `useInfiniteQuery` no `useFeed.ts` — estender para busca com os mesmos princípios
- RLS em todas as tabelas — novas tabelas (`prompty_results` já existe, `reports` é nova) precisam de políticas
- Triggers SQL para pontos — se CUR-01/CUR-02 ganharem pontos, deve ser via trigger (nunca frontend)
- Tailwind único para estilos — sem CSS modules ou styled-components

### Integration Points
- `src/App.tsx` — adicionar rotas `/saved` (SavedPage) e `/search` (SearchPage) dentro de ChromeShell; protegidas por PrivateRoute para L2+
- `src/components/layout/TabBar.tsx` — adicionar tabs Salvos (minLevel L2) e Buscar (minLevel L2)
- `supabase/migrations/` — nova migration para: tabela `reports`, coluna `is_admin` em profiles, índice full-text em promptys, policy para `prompty_results` (já existe na schema mas pode precisar de ajuste de RLS)
- `src/types/database.types.ts` — regenerar após nova migration

</code_context>

<specifics>
## Specific Ideas

- O protótipo (`Promptys v2.html`) mostra a RateSheet com "Anexar imagem (opcional)" já como campo visual — a implementação deve ser fiel a esse layout
- TabBar L2 no protótipo: Feed | Buscar | Perfil. Esta fase adiciona "Salvos" entre Feed e Buscar: **Feed | Salvos | Buscar | Perfil**
- A seção "Resultados da comunidade" na PromptyDetailPage é nova — não existe no protótipo ainda
- Busca usa ícone `search` (lupa) — o protótipo usa `image` para a aba Buscar, mas o ícone correto é `search` (já existe no `Icon.tsx`)

</specifics>

<deferred>
## Deferred Ideas

- Painel de admin no app (AdminPage) — via Supabase Dashboard por ora; pode ser Phase 4+
- Notificações (salvo / resultado aprovado) — Phase 3 ou futura
- Follow system e feed de seguidos — v2 requirements (SOC2-01/02)
- Trending / hot score — DISC-01 (v2)
- Avaliações multi-dimensionais (visual, precisão, originalidade) — ADV-04 (v2)
- L3 Criador features (criar, publicar, variações) — Phase 3

</deferred>

---

*Phase: 02-l2-curador-descoberta*
*Context gathered: 2026-05-08*
