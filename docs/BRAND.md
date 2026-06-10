# Promptys — Identidade Visual

Guia rápido da marca. Fonte única dos assets: `src-tauri/icons/icon-source.svg`
(ícone) e `src-tauri/icons/android-foreground.svg` (foreground adaptativo Android).

## Logo

A marca é um monograma **"P"** em branco com um **prompt sparkle** (estrela de 4
pontas em Solar Coral), sobre um squircle com gradiente Electric Violet → Prompt
Cyan. O "P" representa Promptys; o sparkle evoca a "mágica" da geração por IA — o
mesmo tema da varinha que aparecia no header.

| Asset | Caminho | Uso |
|-------|---------|-----|
| Mark (squircle) | `public/logo.svg`, `public/favicon.svg` | Favicon, web, README |
| Componente React | `src/components/ui/Logo.tsx` | Header e UI in-app |
| Ícone desktop | `src-tauri/icons/*` (`.icns`/`.ico`/`.png`) | macOS / Windows / Linux |
| Ícone Android | `src-tauri/gen/android/.../mipmap-*` | Launcher (adaptive icon) |

Regenerar todos os ícones a partir do source:

```bash
rsvg-convert -w 1024 -h 1024 src-tauri/icons/icon-source.svg -o /tmp/icon.png
pnpm tauri icon /tmp/icon.png
```

> Após `tauri icon`, reaplicar o ícone adaptativo do Android: background gradiente
> (`drawable/ic_launcher_background.xml`), foreground só com a marca
> (`mipmap-*/ic_launcher_foreground.png`, gerado de `android-foreground.svg`) e o
> `mipmap-anydpi-v26/ic_launcher.xml` apontando para ambos + `<monochrome>`.

## Cores

| Nome | Hex | Papel |
|------|-----|-------|
| Midnight Ink | `#090A14` | Fundo base / dark |
| Electric Violet | `#7C3AED` | Primária (início do gradiente) |
| Prompt Cyan | `#22D3EE` | Secundária (fim do gradiente) |
| Solar Coral | `#FF6B4A` | Acento (sparkle, destaques quentes) |
| Mint Signal | `#34D399` | Sucesso / feedback positivo |

Gradiente da marca: linear 135°, `#7C3AED → #5B4BE8 → #22D3EE`.

## Tipografia

- **Space Grotesk** (700) — logo e headings.
- **Inter** — UI.
- **JetBrains Mono** — blocos de prompt.

## Clear space & tamanhos mínimos

- Manter margem livre ≥ 1/4 do lado do ícone ao redor do mark.
- Tamanho mínimo do mark: 24px (UI) / 32px (favicon).
- No Android, a marca vive na *safe zone* central (66%); o gradiente sangra até a
  borda no layer de background.
