import { Icon } from '@/components/ui/Icon'

export function RankingPage() {
  return (
    <main
      className="screen"
      style={{
        padding: '48px 16px 96px',
        textAlign: 'center',
        maxWidth: 430,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* Icon container 60x60 rounded surface-2 with sparkle 26px primary */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          background: 'var(--surface-2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <Icon name="sparkle" size={26} color="var(--primary)" strokeWidth={2} />
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: -0.4,
          lineHeight: 1.25,
          color: 'var(--text-1)',
        }}
      >
        Ranking
      </h1>

      <p
        style={{
          margin: 0,
          maxWidth: 280,
          fontSize: 14,
          color: 'var(--text-2)',
          lineHeight: 1.5,
        }}
      >
        Os criadores que mais contribuíram aparecem aqui. Em breve!
      </p>
    </main>
  )
}
