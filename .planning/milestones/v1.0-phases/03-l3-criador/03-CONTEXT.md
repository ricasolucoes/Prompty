# Phase 3: L3 Criador - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Usuários que atingiram L3 (Criador, 250p+) desbloqueiam a criação e publicação de promptys. Dois fluxos centrais:

1. **Criar e publicar** (CREAT-01, CREAT-02) — wizard multi-step de 4 etapas (a 4ª é opcional), com upload de imagem, campos obrigatórios e opcionais, e publicação direta no feed.
2. **Modo avançado** (CREAT-05) — template com variáveis `{{chave}}`, preview interativo e versões manuais. Etapa 4 do wizard, pulável.
3. **Variações** (CREAT-04) — fork editável de qualquer prompty publicado, com referência ao original. Botão na PromptyDetailPage.
4. **Estatísticas** (CREAT-03) — cópias, saves e feedbacks dos próprios promptys, visíveis na ProfilePage (seção "Meus Promptys").

Esta fase não inclui: ranking geral implementado (aba Ranking existe no TabBar mas pode ser placeholder), sistema de follow, notificações, editor colaborativo.

L3 TabBar: **Feed | Salvos | Buscar | [Criar ★ central] | Ranking | Perfil**

</domain>

<decisions>
## Implementation Decisions

### Fluxo do editor de criação (CREAT-01, CREAT-02)
- Wizard **4 etapas**, abertas pelo botão sparkle central do TabBar:
  - **Etapa 1 — Dados básicos:** título (obrigatório), categoria (obrigatório), complexity_level (simple/guided/advanced, padrão: simple)
  - **Etapa 2 — Prompt beginner:** `beginner_prompt` (obrigatório) — texto plano pronto para copiar
  - **Etapa 3 — Imagem:** upload da imagem de capa para Supabase Storage (opcional, mas recomendado)
  - **Etapa 4 — Modo avançado (opcional):** `advanced_template` com `{{chave}}` + definição de variáveis. Botão "Ignorar" pula esta etapa.
- Publicação acontece ao final da etapa 3 (ou 4 se o criador não ignorar). Status inicial: `published`.
- Tags (`style_tags`) e `recommended_model` são opcionais, aparecem na etapa 1 como campos expandíveis.

### Campos obrigatórios para publicar
- `title` + `beginner_prompt` + `category` — mínimo viável para o feed
- `example_image_url`, `style_tags`, `recommended_model`, `advanced_template`, `inputs_schema` são todos opcionais

### Imagem de capa (CREAT-01)
- Upload direto para **Supabase Storage** — mesmo padrão do prompty-results
- Reutiliza `compressToWebP` do `compress.ts` antes do upload
- URL pública armazenada em `example_image_url` no registro do prompty
- Etapa 3 tem slot de upload; se pulada, o feed exibirá o card sem imagem de capa (fallback para gradiente ou placeholder)

### Estatísticas dos próprios promptys (CREAT-03)
- Seção **"Meus Promptys"** na ProfilePage, visível apenas para L3+
- Grid de cards com: imagem de capa, título, e 3 contadores: cópias / saves / feedbacks
- Dados lidos das tabelas existentes (`prompty_copies` via `record_copy`, `prompty_saves`, `prompty_tests`) — sem nova tabela de stats; agregados via query no cliente ou view
- Sem ranking global aqui — apenas stats pessoais

### Variações simples (CREAT-04)
- Variação = **fork editável** com `parent_id` apontando para o prompty original
- Botão **"Criar variação"** na PromptyDetailPage, visível para qualquer usuário L3 (não apenas o dono do original)
- Abre o wizard de criação com campos pré-preenchidos do original (título, prompt, categoria, imagem) — o criador edita livremente
- Variação publicada aparece **no feed geral como prompty independente**, com crédito "Baseado em [título do original]" linkando para o original
- Schema precisa de coluna `parent_id UUID REFERENCES promptys(id)` (nova — verificar se já existe)

### Modo avançado e variáveis (CREAT-05)
- **Etapa 4 dedicada** no wizard, marcada como "(opcional)" com botão "Ignorar"
- O criador escreve o `advanced_template` com `{{chave}}` livremente. O editor **detecta automaticamente** os placeholders `{{chave}}` no texto e gera um formulário de definição de variáveis abaixo
- Para cada `{{chave}}` detectada: campos de label (exibido ao usuário L2+), tipo (text / enum / number), e valor default — mapeados diretamente para a estrutura `InputField` já tipada em `src/lib/prompty/template.ts`
- Preview ao vivo mostra o template resolvido com os defaults (chama `resolveBeginner()` existente)
- Definições de variáveis salvas em `inputs_schema` JSONB no registro do prompty
- **Versões:** botão **"Salvar versão"** manual na tela de edição do próprio prompty (pós-publicação). Cria snapshot em tabela `prompty_versions` (id, prompty_id, snapshot de campos relevantes, created_at). Sem auto-save.

### Claude's Discretion
- Design visual do wizard (barra de progresso, navegação entre etapas, animações)
- Fallback visual de card sem imagem de capa no feed
- Validação de `{{chave}}` no editor (highlight, contagem de placeholders detectados)
- Exibição do crédito "Baseado em" na detail page e no feed card
- Estrutura exata da tabela `prompty_versions`
- Aba Ranking L3: pode ser placeholder "Em breve" se não houver dados suficientes para um ranking útil no MVP

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protótipo de referência (fonte de verdade visual e de navegação)
- `docs/planning/prototypes/Promptys v2.html` — TabBar L3: botão Criar sparkle central (primary, gradient), aba Ranking (`starFill`). Toda decisão de navegação e UX deve ser consistente com este protótipo.

### Requisitos e roadmap
- `.planning/REQUIREMENTS.md` — CREAT-01 a CREAT-05 (definições formais de cada requisito)
- `.planning/ROADMAP.md` — Phase 3 goal e success criteria

### Contexto de fases anteriores (padrões a seguir)
- `.planning/phases/01-foundation/01-CONTEXT.md` — decisões travadas: separação `beginner_prompt` vs `advanced_template`, estrutura de levels (L3 = 250p+, 5 abas), triggers SQL para pontos, LEVL-07 (sem botões desabilitados)
- `.planning/phases/02-l2-curador-descoberta/02-CONTEXT.md` — padrões estabelecidos: TabBar progressivo, PromptyDetailPage como hub de ações, upload para Storage com compressToWebP, wizard

### Parser de template (reutilizar para modo avançado)
- `src/lib/prompty/template.ts` — exports: `resolveBeginner(template, inputs)`, `InputField` interface (key, label, type, required, default, options, placeholder). A definição de variáveis do modo avançado usa `InputField[]` salva em `inputs_schema` JSONB.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/prompty/template.ts`: `resolveBeginner()` + `InputField` type — reutilizar diretamente para o preview do modo avançado e para salvar `inputs_schema`
- `src/lib/images/compress.ts`: `compressToWebP()` — reutilizar para o upload da imagem de capa na etapa 3
- `src/hooks/useTest.ts`: padrão de upload para Supabase Storage — reutilizar para a imagem de capa do prompty
- `src/pages/PromptyDetailPage.tsx`: hub para ações por-prompty; adicionar botão "Criar variação" para L3 aqui
- `src/pages/ProfilePage.tsx`: expandir com seção "Meus Promptys" para L3
- `src/components/layout/TabBar.tsx`: adicionar botão sparkle central + aba Ranking para L3

### Established Patterns
- Hooks de domínio em `src/hooks/` — criar `useCreatePrompty.ts`, `useMyPromptys.ts`
- Cursor pagination via `useInfiniteQuery` para o grid de "Meus Promptys"
- Triggers SQL para pontos — se publicar prompty concede pontos, deve ser via trigger
- RLS em todas as tabelas — `prompty_versions` e qualquer nova tabela precisam de políticas
- Tailwind único para estilos

### Integration Points
- `src/App.tsx` — rota `/criar` (CriarPage/wizard), possivelmente `/criar/:parentId` para variações
- `src/components/layout/TabBar.tsx` — adicionar botão sparkle primary central + aba Ranking (minLevel L3)
- `src/pages/ProfilePage.tsx` — seção "Meus Promptys" (L3 only)
- `src/pages/PromptyDetailPage.tsx` — botão "Criar variação" (L3 only)
- `supabase/migrations/` — nova migration: coluna `parent_id` em promptys, tabela `prompty_versions`, coluna `inputs_schema` JSONB (verificar se já existe), RLS + policies
- `src/types/database.types.ts` — regenerar após migration

</code_context>

<specifics>
## Specific Ideas

- O wizard tem 4 etapas numeradas — barra de progresso "1 de 4" no topo
- O botão sparkle do TabBar para L3 usa o estilo `primary: true` do protótipo (gradiente 135°, `#8B4DF5 → #22D3EE`, 48×48px, sobe 12px acima da barra)
- A etapa 4 deve deixar claro que é opcional — texto "Modo avançado (opcional)" + botão "Ignorar e publicar" proeminente

</specifics>

<deferred>
## Deferred Ideas

- Ranking geral funcional com algoritmo de pontuação — v2 (GAME2-01)
- Sistema de follow e feed de seguidos — v2 (SOC2-01/02)
- Notificações em tempo real — v2 (SOC2-03)
- Remix com cadeia de atribuição (GitHub-style) — v2 (ADV-03)
- Avaliações multi-dimensionais — v2 (ADV-04)
- Editor avançado colaborativo — out of scope
- Painel de admin no app — Phase 4+ (por ora via Supabase Dashboard)

</deferred>

---

*Phase: 03-l3-criador*
*Context gathered: 2026-05-08*
