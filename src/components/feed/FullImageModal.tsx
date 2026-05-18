import type { CommunityResult } from '@/hooks/useCommunityResults'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'

interface Props {
  result: CommunityResult | null
  onClose: () => void
}

export function FullImageModal({ result, onClose }: Readonly<Props>) {
  if (!result) return null

  const userName = result.user?.name ?? 'Anônimo'
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Resultado enviado por ${userName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn .2s',
      }}
    >
      <button
        type="button"
        aria-label="Fechar imagem"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: 8,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
        }}
      >
        <Icon name="x" size={24} color="#fff" />
      </button>

      <img
        src={result.image_url}
        alt={`Resultado enviado por ${userName}`}
        style={{
          maxWidth: '100%',
          maxHeight: '90vh',
          borderRadius: 12,
          objectFit: 'contain',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 8,
        }}
      >
        <Avatar user={{ name: userName, avatar_url: result.user?.avatar_url ?? null }} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{userName}</div>
          {result.rating != null && (
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFB020' }}>{result.rating}★</div>
          )}
          {result.notes && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 2,
              }}
            >
              {result.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
