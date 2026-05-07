# Navegação e Telas

---

## Estrutura de Telas por Nível

```
L1 (Explorador)
├── Feed (lista única cronológica)
└── Perfil (card simples)

L2 (Curador)
├── Feed (abas: Em alta / Seguindo / Recentes / Para você)
├── Buscar (categorias + trending + criadores)
│   └── Resultados de busca
├── Prompty Detail (abas: Inputs / Testes / Avaliações)
└── Perfil (Progresso / Missões / Conquistas / Biblioteca)

L3 (Criador)
├── Feed
├── Buscar
├── Criar Prompty (fluxo 3 passos)
│   ├── Passo 1: Inspiração (título, descrição, categoria, capa)
│   ├── Passo 2: Prompt (textarea monospace)
│   └── Passo 3: Publicar (resumo + confirmação)
├── Ranking (Semana / Mês / Geral)
│   ├── Pódio (top 3)
│   └── Lista (posições 4+)
├── Prompty Detail (todas as abas, incluindo Remixes)
└── Perfil (completo)
```

---

## Tab Bar

| Tab | Ícone | L1 | L2 | L3 |
|-----|-------|----|----|----|
| Feed | home | ✓ | ✓ | ✓ |
| Buscar | search | ✗ | ✓ | ✓ |
| Criar | plus | ✗ | ✗ | ✓ |
| Ranking | trophy | ✗ | ✗ | ✓ |
| Perfil | user | ✓ | ✓ | ✓ |

Tab bar L1: 2 itens, centralizada.
Tab bar L3: 5 itens, completa.

---

## Onboarding

### L1 — Minimal

```
[1 slide]
"Promptys são receitas prontas para gerar imagens com IA.
 Toque numa, copie, cole no Gemini. Pronto."
[Começar]
```

→ Cai direto no feed. Sem cadastro de interesses, sem tour.

### Advanced

4 slides explicando: feed, criar, remix, gamificação.

---

## Perfil — Abas (L2+)

| Aba | Conteúdo |
|-----|---------|
| Progresso | Nível atual, próximo nível, como ganhar pontos |
| Missões | Diárias + Semanais com barra de progresso |
| Conquistas | Grid de badges (3 colunas) |
| Biblioteca | Usados / Salvos (grid 2 colunas) |

### Hero do Perfil

- TierRing (borda colorida por nível) + Avatar
- Nome + emoji do nível + handle
- Chip do nível + StreakFlame
- Barra de progresso para o próximo nível
- 4 stat cards: Cópias · Avaliações · Curtidas · Salvos

---

## Prompty Detail — Abas

| Aba | L1 | L2 | L3 |
|-----|----|----|-----|
| Inputs | oculto | ✓ | ✓ |
| Testes | ✓ (simplificado) | ✓ | ✓ |
| Avaliações | oculto | ✓ | ✓ |
| Remixes | oculto | oculto | ✓ |

### Aba Inputs

- Lista de InputField por tipo (`text`, `image`, `enum`, `number`)
- Preview do prompt montado (blocos monospace colapsável)
- Botão "Copiar prompt" (fixo no bottom)

---

## Modais

| Modal | Trigger | Descartável |
|-------|---------|-------------|
| Level Up | Cruzar threshold de nível | Sim (1x) |
| Avaliação L1 | Tap em "conte como ficou" | Sim |
| Avaliação L2+ | Post-cópia ou aba Avaliações | Sim |
| Compartilhar | Botão Send | Sim |

---

## Fluxo de Cópia (L1)

```
Card → [📋 Copiar prompt]
  → Botão vira [✓ Copiado · Já usei → avaliar]
  → Banner calmo: "Cole no Gemini..."
  → Tap "conte como ficou" → Modal 1-pergunta
    → [⭐⭐⭐⭐⭐] + foto opcional
    → [Enviar +5p]
```
