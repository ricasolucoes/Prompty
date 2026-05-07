# Modo Iniciante (Progressive Disclosure)

Spec completa da experiência progressiva por nível. Fonte: `BEGINNER_MODE_SPEC.md`.

---

## Princípio

> O usuário iniciante não sabe o que é prompt. Ele quer uma imagem legal.

A primeira sessão cabe em uma frase:
**"Veja → Copie → Cole no Gemini → Volte e dê estrelas."**

Tudo que não serve esse loop fica oculto até o usuário provar interesse.

---

## Os Três Níveis de Experiência

| Nível | Nome | Pontos | O que acessa |
|-------|------|--------|--------------|
| L1 | Explorador | 0–49p | Feed simples + perfil mínimo |
| L2 | Curador | 50–249p | + Busca, Salvos, Seguir autores |
| L3 | Criador | 250p+ | + Criar Prompty, Remix, Ranking, tudo |

Para sair do L1: ~8–10 usos reais (~3 dias de uso casual).

---

## Diferenças por Tela

### Onboarding

- **L1:** 1 slide, 1 frase, 1 botão. Sem cadastro de interesses, sem tour.
- **Advanced:** 4 slides explicando feed, criar, remix, gamificação.

### Tab bar

| L1 | Advanced |
|----|---------|
| Feed · Perfil (2 abas) | Feed · Buscar · Criar · Ranking · Perfil (5 abas) |

### Feed — Card L1

Estrutura do card (de cima para baixo):
1. Avatar + nome do autor (sem nível, sem badge)
2. Título do prompty (1 linha, grande)
3. Texto do prompt (3 linhas + "Ver mais")
4. Imagem (full-width)
5. Linha de reações (curtir, contagem) — sem comentar/compartilhar até L2
6. Botão único: `[📋 Copiar prompt]`
7. Após cópia: `[✓ Copiado · Já usei → avaliar]`

Sem: chips de modelo, dificuldade, stats, variáveis, versão, categoria, remix.

### Toque no Card (L1)

Não há página de detalhe complexa. O card é tudo.

Se o prompty tem variáveis, elas são **pré-preenchidas com valores padrão** e o usuário copia o prompt já montado. Variáveis ficam invisíveis até L2.

### Após Copiar

Banner calmo aparece:
> "Copiado para você. Cole no Gemini, ChatGPT ou Midjourney. Quando voltar, [conte como ficou ⭐]"

Modal de avaliação L1 tem apenas:
- "Funcionou bem?" → 5 estrelas
- Opção de anexar imagem gerada
- `[Enviar +5p]`

Sem dimensões múltiplas (visual_quality, prompt_accuracy, etc.) — isso é L2+.

### Perfil L1

- Avatar + Nome
- "Você usou X promptys" (não "pontos" — jargão)
- Barra de progresso: "Falta pouco para desbloquear Buscar e Salvos"
- Lista de últimos promptys usados (thumbnails clicáveis para reusar)

Sem: badges visuais, ranking de amigos, seguindo.

### Telas removidas no L1

- ❌ Buscar (disponível em L2)
- ❌ Ranking (disponível em L3, opt-in)
- ❌ Criar prompty (disponível em L3)
- ❌ Remix (disponível em L3)
- ❌ Modelos múltiplos / dificuldade / negative prompt
- ❌ Página de detalhe com abas

---

## Desbloqueio

Quando o usuário cruza o threshold:
1. Modal celebrativo (1 vez, dispensável)
2. Tab bar anima novos ícones **aparecendo** (não desbloqueando)

### O que L2 ganha
- Busca por estilo / autor
- Salvos (biblioteca pessoal)
- Seguir autores → aba "Seguindo" no feed
- Comentar
- Avaliação multi-dimensional
- Variáveis editáveis

### O que L3 ganha
- Botão "+ Criar" na tab bar
- Fluxo completo de criação (5 passos)
- Remix
- Ranking semanal
- Badges visuais no perfil
- Negative prompt, modelos múltiplos, dificuldade

---

## Copy por Nível

| Não usar (advanced) | Usar (L1) |
|--------------------|-----------|
| "prompt" | "receita de imagem" (1ª menção) |
| "remixar" | (não existe ainda) |
| "modelo" (Midjourney/Flux) | "use no app de IA que você quiser" |
| "negative prompt" | (não existe) |
| "+50p" | "Você desbloqueou +1 nível" |
| "v2.1" | (não mostrar versão) |
| "rating breakdown" | "como ficou?" |
| "community-remix license" | (não existe) |

---

## Métricas de Sucesso do L1

| Métrica | Alvo |
|---------|------|
| % que copia ≥ 1 prompt na 1ª sessão | 80% |
| % que volta para avaliar | 30% |
| Tempo até desbloquear L2 (mediana) | < 7 dias |
| % que desbloqueia L2 e continua ativo | 50% |

---

## Tweak de Debug

Painel de Tweaks inclui radio **"Nível do usuário"** → L1 / L2 / L3 para stakeholders visualizarem os três modos sem precisar ganhar pontos. Padrão: L1.
