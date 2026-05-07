import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeedItem } from '@/hooks/useFeed'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { resolveBeginner, type InputField } from '@/lib/prompty/template'

interface FeedCardProps {
  prompty: FeedItem
  liked?: boolean
  copied?: boolean
  rated?: boolean
  onLike?: () => void
  onCopy?: () => void
  onRate?: () => void
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = Math.max(0, now - then)
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.floor(h / 24)
  return `${d} d`
}

export function FeedCard({
  prompty,
  liked = false,
  copied = false,
  rated = false,
  onLike,
  onCopy,
  onRate,
}: FeedCardProps) {
  const [expanded, setExpanded] = useState(false)
  const author = prompty.profiles
  const inputs = (Array.isArray(prompty.inputs_schema) ? prompty.inputs_schema : []) as unknown as InputField[]
  const resolved = useMemo(() => resolveBeginner(prompty.template, inputs), [prompty.template, inputs])
  const cover = prompty.cover_url
    ? undefined
    : prompty.cover_gradient ?? 'linear-gradient(135deg,#3b1d6e 0%,#7C3AED 50%,#FF6B4A 100%)'

  return (
    <article
      className="screen"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        marginBottom: 8,
      }}
    >
      {/* Author header */}
      <header style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar user={{ name: author?.name ?? 'Promptys', avatar_url: author?.avatar_url ?? null }} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>
            {author?.name ?? 'Promptys'}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
            compartilhou um Prompty · {relativeTime(prompty.created_at)}
          </div>
        </div>
      </header>

      {/* Title — clickable to /p/:slug for detail view (FEED-03) */}
      <h2
        style={{
          margin: 0,
          padding: '0 16px 8px',
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: -0.4,
          lineHeight: 1.25,
          color: 'var(--text-1)',
        }}
      >
        <Link
          to={`/p/${prompty.slug}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {prompty.title}
        </Link>
      </h2>

      {/* Prompt section */}
      <section style={{ padding: '0 16px 12px' }}>
        <p
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          Prompt
        </p>
        <div
          data-testid="prompt-text"
          style={{
            fontSize: 13.5,
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'var(--text-2)',
            whiteSpace: 'pre-wrap',
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? undefined : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resolved}
        </div>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              marginTop: 4,
              padding: 0,
              background: 'none',
              border: 'none',
              color: 'var(--text-1)',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            Ver mais
          </button>
        )}
      </section>

      {/* Cover image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '4/5',
          background: prompty.cover_url ? `url(${prompty.cover_url}) center/cover no-repeat` : cover,
        }}
        aria-label={`Imagem de exemplo do Prompty ${prompty.title}`}
        role="img"
      />

      {/* Reaction count row */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 18, height: 18, borderRadius: 9,
            background: 'var(--like)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <Icon name="heartFill" size={11} color="#fff" />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Curtidas</span>
      </div>

      {/* Action row — Curtir + Copiar (LEVL-06: NO save, NO remix, NO share) */}
      <div
        style={{
          margin: '0 16px',
          padding: '4px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <button
          type="button"
          onClick={onLike}
          aria-label="Curtir"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 8px', borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: liked ? 'var(--like)' : 'var(--text-2)',
            fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5, fontWeight: 700,
          }}
        >
          <Icon name={liked ? 'heartFill' : 'heart'} size={20} color={liked ? 'var(--like)' : 'currentColor'} />
          <span>Curtir</span>
        </button>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copiado' : 'Copiar prompt'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 8px', borderRadius: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: copied ? '#34D399' : 'var(--text-2)',
            fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5, fontWeight: 700,
          }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={20} color={copied ? '#34D399' : 'currentColor'} />
          <span>{copied ? 'Copiado!' : 'Copiar prompt'}</span>
        </button>
      </div>

      {/* Post-copy banner appears below action row when copied=true and rated=false (plan 07 wires the rate flow) */}
      {copied && !rated && (
        <PostCopyBanner {...(onRate ? { onRate } : {})} />
      )}
      {rated && <PostRateConfirmation />}
    </article>
  )
}

function PostCopyBanner({ onRate }: { onRate?: () => void }) {
  return (
    <div
      role="region"
      aria-label="Avaliar prompty"
      style={{
        margin: '12px 16px 16px',
        padding: 16,
        borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(34,211,238,0.06))',
        border: '1px solid var(--line)',
        animation: 'fadeIn .25s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon name="sparkle" size={16} color="var(--primary)" />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>
          Cole no Gemini, ChatGPT ou Midjourney
        </span>
      </div>
      <p style={{ margin: 0, marginBottom: 12, fontSize: 13.5, lineHeight: 1.4, color: 'var(--text-2)' }}>
        Quando voltar com a imagem pronta, conte para a comunidade como ficou.
      </p>
      <button
        type="button"
        onClick={onRate}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #8B4DF5, #7C3AED)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: 13.5,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name="star" size={18} color="#fff" />
        Avaliar este prompt (+5p)
      </button>
    </div>
  )
}

function PostRateConfirmation() {
  return (
    <div
      role="status"
      style={{
        margin: '12px 16px 16px',
        padding: '8px 12px',
        borderRadius: 12,
        background: 'rgba(52,211,153,0.10)',
        border: '1px solid rgba(52,211,153,0.25)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <Icon name="check" size={16} color="#34D399" />
      <span style={{ fontSize: 13.5, color: 'var(--text-1)' }}>
        Você já avaliou este Prompty. Obrigada!
      </span>
    </div>
  )
}
