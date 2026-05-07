# Feed e Interações

---

## Abas do Feed (Advanced / L2+)

| Key | Label |
|-----|-------|
| `trending` | Em alta |
| `new` | Novos |
| `tested` | Mais testados |
| `top` | Melhor avaliados |
| `remix` | Remixáveis |
| `easy` | Iniciantes |

No L1, o feed é uma única lista cronológica sem abas.

---

## Card do Feed

### Estrutura (Advanced)

1. **Capa** — imagem full-width com gradiente de sobreposição na base
2. **Chips** — modelo(s), dificuldade, versão (canto superior)
3. **Autor** — avatar + nome + nível
4. **Título** — Space Grotesk, 800 weight
5. **Descrição** — 2 linhas truncadas
6. **Stats** — testes · likes · saves (formato compacto)
7. **Ações** — Like / Save / Remix / Compartilhar

### Estrutura (L1)

1. Avatar + nome do autor
2. Título (1 linha, grande)
3. Texto do prompt (3 linhas + "Ver mais")
4. Imagem full-width
5. Curtir + contagem
6. Botão `[📋 Copiar prompt]`

---

## Interações com o Prompty

| Ação | Dispatch | Ponto |
|------|----------|-------|
| Curtir/Descurtir | `toggleLike` | +1p (cap 10/dia) |
| Salvar/Remover dos salvos | `toggleSave` | — |
| Copiar prompt | — | +5p (por prompty) |
| Avaliar | — | +5p (uma vez por prompty) |

---

## Tela de Detalhe do Prompty

### Abas

| Aba | Conteúdo | Nível |
|-----|----------|-------|
| Inputs | Variáveis editáveis + preview do prompt | L2+ (L1 oculta) |
| Testes | Galeria de testes da comunidade com modelo e nota | L1+ |
| Avaliações | Médias por dimensão + lista de reviews | L2+ |
| Remixes | Promptys derivados | L3+ |

### Header da tela

- Botão voltar (flutuante sobre a capa)
- Like, Save, Compartilhar (flutuantes)
- Cover hero: 360px de altura
- Chips de modelo + dificuldade + versão
- Título (h1, 26px, Space Grotesk 800)
- Avatar do autor com nível e stats de seguidores

---

## Busca (L2+)

### Componentes

- Barra de pesquisa sticky no topo
- Sem query: exibe Categorias + Em Alta + Criadores em Destaque
- Com query: grid 2 colunas de resultados (filtro em título + texto do prompt)

### Categorias

| ID | Label | Emoji |
|----|-------|-------|
| `portrait` | Retratos | 👤 |
| `landscape` | Paisagens | 🏞️ |
| `product` | Produto | 📦 |
| `character` | Personagem | 🎭 |
| `editorial` | Editorial | 🗞️ |
| `mascot` | Mascote 3D | 🦊 |
| `fantasy` | Fantasia | 🐉 |
| `logo` | Logos | ✦ |

---

## Header do App

- Logo + "Promptys" (Space Grotesk 700, 22px)
- Ícones: Ranking (trophy), Notificação (bell com dot coral), Avatar
- Barra de busca (abre SearchScreen ao tocar)
- PointsPill (nível atual + pontos + barra de progresso)
- Botão "Criar Prompty" (apenas L3)

---

## Notificações (Activity)

Tipos de evento no feed de atividade:

| Tipo | Exemplo |
|------|---------|
| `remix` | "remixou seu Prompty Retrato Cinematográfico" |
| `rating` | "avaliou seu Prompty com 5 estrelas" |
| `badge` | "desbloqueou Community Spark" |
| `test` | "testou Cartaz Editorial Y2K" |
| `comment` | "comentou em Brutalismo Solar" |
