# Política de Segurança

## Versões suportadas

Apenas a última minor release recebe correções de segurança.

| Versão | Suportada |
|---------|-----------|
| 1.0.x   | ✅        |
| < 1.0   | ❌        |

## Reportar uma vulnerabilidade

**Não abra issue pública para vulnerabilidades.** Issues públicas dão tempo de exploração para atacantes antes do fix sair.

Envie um e-mail para **sierra.csi@gmail.com** com:

- Descrição do problema
- Passos para reproduzir
- Impacto potencial (o que um atacante consegue?)
- Se possível, sugestão de fix

Vamos:

1. **Confirmar recebimento** em até 72h
2. **Investigar** e avaliar severidade
3. **Coordenar disclosure** com você — typically 60-90 dias até patch público
4. **Creditar você** no advisory público (se quiser)

Para descobertas em dependências (Supabase, Tauri, React, etc.), reporte ao projeto upstream primeiro e nos avise depois.

## Áreas sensíveis

Atenção especial a:

- **Row-Level Security (RLS)** no Supabase — qualquer caminho que contorne RLS
- **Tauri commands** — comandos Rust expostos ao frontend (`src-tauri/src/commands/`)
- **`point_events` e triggers de gamificação** — qualquer forma de farmar pontos sem ação real
- **Storage policies** — uploads em `prompty-covers/` e `prompty-results/` precisam respeitar ownership
- **Auth flow** — manipulação de sessão, reset de senha, signup

## Não está no escopo

- Issues de UX que não vazam dados
- Ataques que requerem acesso físico ao dispositivo do usuário
- Bugs em integrações de terceiros (Gemini, etc.) — reporte upstream

Obrigado por ajudar a manter Promptys e seus usuários seguros.
