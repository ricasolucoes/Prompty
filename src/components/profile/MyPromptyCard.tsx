import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import type { MyPromptyWithStats } from '@/hooks/useMyPromptys'

interface Props {
  prompty: MyPromptyWithStats
}

const FALLBACK_GRADIENT = 'linear-gradient(135deg,#3b1d6e 0%,#7C3AED 50%,#FF6B4A 100%)'

export function MyPromptyCard({ prompty }: Props) {
  const coverBg = prompty.cover_url
    ? `url(${prompty.cover_url}) center/cover no-repeat`
    : (prompty.cover_gradient ?? FALLBACK_GRADIENT)

  return (
    <Link
      to={`/p/${prompty.slug}`}
      aria-label={`Ver Prompty ${prompty.title}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        aspectRatio: '4/5',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Cover thumbnail — 60% height */}
        <div
          style={{ flex: '0 0 60%', background: coverBg }}
          role="img"
          aria-label={`Capa de ${prompty.title}`}
        />

        {/* Bottom — title + stats */}
        <div
          style={{
            flex: '1 1 40%',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.2,
              color: 'var(--text-1)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {prompty.title}
          </h3>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatItem icon="copy" color="#22D3EE" count={prompty.copies} label="Cópias" />
            <StatItem icon="bookmark" color="#7C3AED" count={prompty.saves} label="Saves" />
            <StatItem icon="starFill" color="#FFB020" count={prompty.feedbacks} label="Feedbacks" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatItem({ icon, color, count, label }: { icon: IconName; color: string; count: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
      aria-label={`${count} ${label}`}
    >
      <Icon name={icon} size={16} color={color} />
      <span
        style={{
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-1)',
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-3)',
        }}
      >
        {label}
      </span>
    </span>
  )
}
