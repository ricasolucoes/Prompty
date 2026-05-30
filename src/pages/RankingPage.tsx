import { Link } from 'react-router-dom'
import { useRanking, type RankingEntry } from '@/hooks/useRanking'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { levelOf } from '@/lib/constants/levels'

const MEDALS = ['🥇', '🥈', '🥉']
const COLOR_TEXT_1 = 'var(--text-1)'
const COLOR_TEXT_3 = 'var(--text-3)'

export function RankingPage() {
  const { entries, loading, myRank } = useRanking()
  const userId = useAuthStore((s) => s.user?.id)
  const showMyRankFooter = !loading && myRank != null && myRank > entries.length

  return (
    <main className="screen" style={{ padding: '20px 16px 96px', maxWidth: 430, margin: '0 auto' }}>
      <RankingHeader />

      {loading && <RankingSkeleton />}

      {!loading && entries.length === 0 && <RankingEmpty />}

      {!loading && entries.length > 0 && (
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {entries.map((entry, i) => (
            <li key={entry.id}>
              <RankRow entry={entry} rank={i + 1} isMe={entry.id === userId} />
            </li>
          ))}
        </ol>
      )}

      {showMyRankFooter && (
        <p
          aria-live="polite"
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 13.5,
            color: 'var(--text-2)',
          }}
        >
          Você está em <strong style={{ color: COLOR_TEXT_1 }}>#{myRank}</strong>
        </p>
      )}
    </main>
  )
}

function RankingHeader() {
  return (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        textAlign: 'center',
      }}
    >
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
        <Icon name="starFill" size={26} color="var(--primary)" strokeWidth={2} />
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: -0.4,
          color: COLOR_TEXT_1,
        }}
      >
        Ranking
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: 280,
          fontSize: 13.5,
          color: 'var(--text-2)',
          lineHeight: 1.5,
        }}
      >
        Os criadores que mais contribuíram com a comunidade.
      </p>
    </header>
  )
}

function RankRow({
  entry,
  rank,
  isMe,
}: Readonly<{ entry: RankingEntry; rank: number; isMe: boolean }>) {
  const lvl = levelOf(entry.points)
  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        background: isMe
          ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
          : 'var(--surface)',
        border: isMe ? '1px solid var(--primary)' : '1px solid var(--line)',
      }}
    >
      <div style={{ width: 28, flexShrink: 0, textAlign: 'center' }}>
        <RankBadge rank={rank} />
      </div>

      <Avatar user={{ name: entry.name, avatar_url: entry.avatar_url }} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLOR_TEXT_1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.name ?? 'Sem nome'}
          </span>
          {entry.verified && (
            <Icon name="check" size={13} color="var(--primary)" strokeWidth={2.5} />
          )}
        </div>
        <span style={{ fontSize: 12, color: lvl.color, fontWeight: 700 }}>
          {lvl.emoji} {lvl.name}
          {entry.username && (
            <span style={{ color: COLOR_TEXT_3, fontWeight: 400 }}> · @{entry.username}</span>
          )}
        </span>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 15,
            fontWeight: 700,
            color: COLOR_TEXT_1,
          }}
        >
          {entry.points.toLocaleString('pt-BR')}
        </span>
        <span style={{ fontSize: 11, color: COLOR_TEXT_3, marginLeft: 3 }}>pts</span>
      </div>
    </div>
  )

  if (entry.username) {
    return (
      <Link
        to={`/u/${entry.username}`}
        aria-label={`Ver perfil de ${entry.name ?? entry.username}`}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        {inner}
      </Link>
    )
  }
  return inner
}

function RankBadge({ rank }: Readonly<{ rank: number }>) {
  const medal = MEDALS[rank - 1]
  if (medal) {
    return (
      <span style={{ fontSize: 22 }} aria-label={`${rank}º lugar`}>
        {medal}
      </span>
    )
  }
  return <span style={{ fontSize: 13.5, fontWeight: 700, color: COLOR_TEXT_3 }}>#{rank}</span>
}

function RankingSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            height: 64,
            borderRadius: 14,
            background: 'var(--surface-2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              animation: 'shimmer 1.4s linear infinite',
            }}
          />
        </div>
      ))}
    </div>
  )
}

function RankingEmpty() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      <Icon name="sparkle" size={36} color={COLOR_TEXT_3} />
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 17,
          fontWeight: 700,
          color: COLOR_TEXT_1,
        }}
      >
        O ranking está sendo formado
      </h2>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
        Use, avalie e crie Promptys para aparecer aqui.
      </p>
    </div>
  )
}
