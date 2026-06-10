/**
 * Logo — marca do Promptys.
 * Monograma "P" + prompt sparkle (Solar Coral) sobre o gradiente
 * Electric Violet → Prompt Cyan do design system.
 * Fonte única do mark; use em qualquer lugar que precise do ícone da marca.
 */
type LogoProps = {
  /** Lado do quadrado em px. */
  size?: number
  /** Raio do squircle; default proporcional ao tamanho. */
  radius?: number
}

export function Logo({ size = 30, radius }: LogoProps) {
  const rx = radius ?? Math.round(size * 0.3)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      role="img"
      aria-label="Promptys"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="promptys-bg" x1="120" y1="120" x2="904" y2="904" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="0.5" stopColor="#5B4BE8" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="40" y="40" width="944" height="944" rx={(rx / size) * 1024} fill="url(#promptys-bg)" />
      <path
        d="M406 716 V356 H552 A92 92 0 0 1 552 540 H406"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="98"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M672 296 C672 352 690 370 746 370 C690 370 672 388 672 444 C672 388 654 370 598 370 C654 370 672 352 672 296 Z"
        fill="#FF6B4A"
      />
    </svg>
  )
}
