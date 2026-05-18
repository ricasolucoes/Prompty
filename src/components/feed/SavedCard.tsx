import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'

interface SavedCardProps {
  slug: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
  result_image_url?: string | null
}

export function SavedCard({
  slug,
  title,
  cover_url,
  cover_gradient,
  result_image_url,
}: Readonly<SavedCardProps>) {
  const isResult = !!result_image_url
  const imageUrl = isResult ? result_image_url : cover_url
  const hasImage = !!imageUrl
  const background = hasImage
    ? undefined
    : (cover_gradient ?? 'linear-gradient(135deg,#7C3AED,#22D3EE)')
  const backgroundImage = hasImage ? `url(${imageUrl})` : undefined
  const backgroundSize = hasImage ? 'cover' : undefined
  const backgroundPosition = hasImage ? 'center' : undefined
  const backgroundRepeat = hasImage ? 'no-repeat' : undefined

  return (
    <Link
      to={`/p/${slug}`}
      aria-label={`Ver prompty: ${title}`}
      style={{
        display: 'block',
        aspectRatio: '4/5',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        background,
        backgroundImage,
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
        textDecoration: 'none',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      {/* Bottom gradient scrim */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* Title (line-clamp 2) */}
      <span
        data-testid="saved-card-title"
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {title}
      </span>

      {/* Camera badge for Resultados variant */}
      {isResult && (
        <span
          data-testid="saved-card-camera-badge"
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: 'var(--surface)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="image" size={10} color="var(--text-2)" />
        </span>
      )}
    </Link>
  )
}
