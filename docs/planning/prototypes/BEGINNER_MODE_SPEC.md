# Promptys — Especificação do Modo Iniciante

> Documento de design. Define como a experiência se simplifica para usuários novos e como funcionalidades são desbloqueadas conforme o nível sobe.

---

## 1. Princípio

> O usuário iniciante **não sabe o que é prompt**. Ele quer uma imagem legal. Ponto.

A primeira sessão precisa caber em uma frase:

**"Veja → Copie → Cole no Gemini → Volte e dê estrelas."**

Tudo o que não serve esse loop é distração e fica escondido até o usuário provar interesse.

---

## 2. Os três níveis de experiência

| Nível | Nome interno | Quando | O que vê |
|---|---|---|---|
| **L1** | Iniciante (Explorador) | 0–49 pontos | Só feed simples + perfil mínimo |
| **L2** | Curador | 50–249 pontos | + busca, salvos, seguir autores |
| **L3** | Criador | 250+ pontos | + criar prompty, remix, ranking, tudo |

**Pontos no L1 vêm só de:**
- Avaliar um prompty que você usou: **+5p** (uma vez por prompty)
- Curtir: **+1p** (limite 10/dia)
- Login diário: **+2p**

Isso significa: para sair do L1, basta usar 8–10 promptys de verdade. ~3 dias de uso casual.

---

## 3. Tela por tela — o que muda no L1

### 3.1 Onboarding
**Antes (advanced):** 4 slides explicando feed, criar, remix, gamificação.
**L1:** **1 slide.** Uma frase + um botão.

> "Promptys são receitas prontas para gerar imagens com IA. Toque numa, copie, cole no Gemini. Pronto."
> [Começar]

Sem cadastro de interesses, sem tour. Cai direto no feed.

### 3.2 Tab bar
**Advanced:** Feed · Buscar · Criar · Ranking · Perfil (5 abas)
**L1:** Feed · Perfil (2 abas)

A barra fica menor e centralizada. Sem botão "+ criar". Sem ranking. Sem busca.

### 3.3 Feed
**Advanced:** Cards com badges complexos (modelo, dificuldade, versão, stats em fila), 4 abas (Em alta / Seguindo / Recentes / Para você), filtros.

**L1:** **Cards estilo Facebook/Instagram.** Uma única lista cronológica + visual.

Estrutura do card L1 (de cima para baixo):
1. **Avatar + nome do autor** (tamanho normal, sem nível, sem badge)
2. **Título do prompty** (1 linha, grande)
3. **Texto do prompt** (3 linhas + "Ver mais" — exatamente como o screenshot do Facebook)
4. **Imagem** (full-width, aspect-ratio livre 4:5 ou 1:1)
5. **Linha de reações** (curtir, contagem) — sem comentar/compartilhar até L2
6. **Botão único, grande, primário: [📋 Copiar prompt]**
7. Após cópia, o botão vira: **[✓ Copiado · Já usei → avaliar]**

Sem chips de modelo. Sem dificuldade. Sem stats numéricas. Sem variáveis. Sem versão. Sem categoria. Sem "remix" como conceito.

### 3.4 Tocar no card
**Advanced:** abre detail page com 4 abas (Inputs / Testes / Avaliações / Remixes) e variáveis editáveis.

**L1:** **Não tem detail page complexa.** O card é tudo.

Se o prompty tem variáveis no template, elas são **pré-preenchidas com valores padrão** e o usuário copia o prompt já montado. Variáveis ficam invisíveis até L2.

### 3.5 Após copiar
Banner curto e calmo aparece embaixo:

> Copiado para você. Cole no Gemini, ChatGPT ou Midjourney.
> Quando voltar, [conte como ficou ⭐]

Toque em "conte como ficou" → modal de **uma pergunta**:
- "Funcionou bem?" — 5 estrelas
- (opcional) Toque para anexar a imagem que você gerou
- [Enviar +5p]

Sem dimensões múltiplas (visual_quality, prompt_accuracy, etc). Isso só aparece no L2+.

### 3.6 Perfil L1
**Advanced:** banner com gradiente, nível, pontos, próxima badge, 4 tabs (Promptys / Salvos / Testes / Badges).

**L1:** Card único, vertical:
- Avatar grande
- Nome
- **"Você usou X promptys"** (não "pontos" ainda — pontos é jargão)
- Barra de progresso fina: **"Falta pouco para desbloquear Buscar e Salvos"**
- Lista simples: "Seus últimos promptys usados" — thumbnails clicáveis para reusar

Sem badges visuais. Sem ranking de amigos. Sem "seguindo".

### 3.7 Telas removidas no L1
- ❌ Buscar (até L2)
- ❌ Ranking (até L3 — e mesmo aí, opt-in)
- ❌ Criar prompty (até L3)
- ❌ Remix (até L3)
- ❌ Modelos múltiplos / dificuldade / negative prompt
- ❌ Página de detalhe com tabs

---

## 4. Desbloqueio — como funciona na prática

Quando o usuário cruza o threshold, ao abrir o app:

**Modal celebrativo (1 vez, dispensável):**
> 🎉 Você desbloqueou **Curador**
> Agora você pode buscar promptys, salvar favoritos, e seguir criadores.
> [Ver o que mudou] [Continuar usando]

A tab bar **anima** novos ícones aparecendo (não "estavam cinza" — não estavam lá). Isso evita a sensação de "estou bloqueado", e troca por "estou crescendo".

Em nenhum momento o L1 vê uma tela cinza com cadeado. **Nada do que ele não pode usar é mostrado.**

### Regra de ouro
Se um iniciante pergunta "como faço pra criar um prompty?", a resposta é:
> "Use mais alguns. O app vai te mostrar quando for a hora."

Isso é educativo: os primeiros usos ensinam o que é um prompt antes de pedir para criar um.

---

## 5. Diferenças L2 → L3 (resumo curto)

**L2 (Curador) ganha:**
- Busca por estilo / autor
- Salvos (biblioteca pessoal)
- Seguir autores → aba "Seguindo" no feed
- Reações expandidas (comentar)
- Avaliação multi-dimensional (qualidade, fidelidade, originalidade)
- Variáveis editáveis nos promptys

**L3 (Criador) ganha:**
- Botão "+ Criar" na tab bar
- Fluxo completo de criar prompty (5 passos)
- Remix
- Ranking semanal
- Badges visuais no perfil
- Negative prompt, modelos múltiplos, dificuldade

---

## 6. Voz e copy no L1

A copywriting muda de tom também. L1 evita jargão:

| Não usar (advanced) | Usar (L1) |
|---|---|
| "prompt" | "receita de imagem" (na primeira menção) → depois "prompt" |
| "remixar" | (não existe ainda) |
| "modelo" (Midjourney/Flux) | "use no app de IA que você quiser" |
| "negative prompt" | (não existe) |
| "+50p" | "Você desbloqueou +1 nível" |
| "v2.1" | (não mostrar versão) |
| "rating breakdown" | "como ficou?" |
| "community-remix license" | (não existe) |

---

## 7. Um Tweak para alternar

Adicionar ao painel de Tweaks: **"Nível do usuário"** — radio com L1 / L2 / L3.

Permite ao stakeholder ver os três modos no mesmo arquivo, sem ter que ganhar pontos.

Padrão: L1 (a versão clean é o ponto de partida do produto).

---

## 8. Métricas de sucesso para o L1

- **% que copia ≥ 1 prompt na 1ª sessão** (alvo: 80%)
- **% que volta para avaliar** (alvo: 30%)
- **Tempo até desbloquear L2** (alvo: mediana < 7 dias)
- **% que desbloqueia L2 e continua ativo** (alvo: 50%)

Se o iniciante gosta o suficiente para virar Curador, ele provavelmente vira Criador eventualmente.

---

## 9. O que está fora deste documento

- Moderação de conteúdo, reports, bloqueios
- Pagamento / planos
- Notificações push
- Detalhes de API com modelos de IA

Esses ficam para uma rodada seguinte.
