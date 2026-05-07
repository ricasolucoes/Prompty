# Promptys

## What This Is

Promptys é uma rede social colaborativa, gratuita e gamificada para criar, compartilhar, testar, remixar e avaliar prompts avançados de geração de imagens. A unidade central é o **Prompty**: um template parametrizável com variáveis, imagens de referência, negative prompts, configurações de modelo, exemplos de saída, histórico de versões, testes reais e avaliações da comunidade. O produto posiciona-se como "a rede social dos prompts visuais que realmente funcionam."

## Core Value

Um Prompty é mais que texto — é um template versionado com variáveis, testes reais e ranking comunitário que prova quais prompts funcionam em diferentes modelos de IA.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Usuário pode criar conta e autenticar via Supabase Auth
- [ ] Usuário pode criar, publicar e editar Promptys com template parametrizável
- [ ] Usuário pode navegar um feed social de Promptys com múltiplas ordenações
- [ ] Usuário pode testar um Prompty preenchendo variáveis e subindo imagem resultado
- [ ] Usuário pode curtir, salvar e remixar Promptys
- [ ] Usuário pode avaliar Promptys em múltiplas dimensões
- [ ] Usuário pode comentar em Promptys
- [ ] Usuário acumula pontos por contribuições e sobe de nível
- [ ] Sistema de moderação básica com status e denúncias
- [ ] Busca por título, tags, modelo e dificuldade

### Out of Scope

- Geração de imagens diretamente no app (MVP) — requer Edge Functions + APIs pagas; fica para MVP 3
- Importação automática de grupos do Facebook — risco legal; apenas curadoria manual permitida
- Backend próprio — Supabase elimina necessidade no MVP
- App mobile nativo — web-first, mobile via PWA/responsivo
- OAuth social (Google/GitHub) no MVP — email/password suficiente para validar
- Embeddings e recomendação por similaridade — pós-MVP

## Context

- **Origem:** Projeto inspirado em grupos de compartilhamento de prompts no Facebook; missão é dar uma casa técnica e colaborativa para esses prompts
- **Stack definida:** Next.js (frontend) + Supabase (Auth, Postgres, Storage, Realtime, RLS) + Vercel/Netlify deploy
- **Edge Functions:** Apenas para APIs de IA, webhooks de pagamento e lógica privada
- **Gamificação anti-spam:** Pontos devem ser concedidos via triggers SQL e tabela `point_events` imutável — nunca pelo frontend
- **Identidade visual definida:** Midnight Ink #090A14, Electric Violet #7C3AED, Prompt Cyan #22D3EE, Solar Coral #FF6B4A, Mint Signal #34D399; tipografia Space Grotesk (logo), Inter (UI), JetBrains Mono (blocos de prompt)
- **Sintaxe de template:** `{{variavel}}` com inputs_schema JSONB definindo tipos (text, image, enum, number, boolean, color, ratio, seed)
- **Modelo de dados:** 10 tabelas principais já especificadas (profiles, promptys, prompty_versions, prompty_tests, prompty_ratings, prompty_likes, prompty_saves, prompty_remixes, point_events)
- **RLS obrigatório:** Todas as tabelas com Row Level Security habilitado desde o início

## Constraints

- **Tech Stack:** Next.js + Supabase — decisão final, sem backend próprio no MVP
- **Custo:** Supabase free tier para MVP; monitorar limites antes de escalar
- **Jurídico:** Nenhuma importação automática de conteúdo; crédito obrigatório para prompts importados
- **Moderação:** Conteúdo adulto explícito, deepfakes enganosos e prompts para conteúdo ilegal são proibidos desde o MVP
- **Monetização futura:** Não pode bloquear a biblioteca comunitária gratuita

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase como única infraestrutura de backend no MVP | Reduz custo, complexidade operacional e time-to-market; Auth + Storage + Realtime + RLS integrados | — Pending |
| Pontos via triggers SQL e `point_events` imutável | Previne manipulação via frontend; auditabilidade completa | — Pending |
| Template syntax `{{variavel}}` | Simples, familiar (handlebars-like), parseável no frontend sem dependência extra | — Pending |
| Next.js como frontend | SSR para SEO do feed público; ecossistema maduro; deploy trivial na Vercel | — Pending |
| Sem OAuth no MVP | Reduz escopo; email/password valida o produto antes de adicionar complexidade | — Pending |

---
*Last updated: 2026-05-06 after initialization*
