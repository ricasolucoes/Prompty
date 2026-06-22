interface GeneratedImageModalProps {
  readonly signedUrl: string
  readonly onClose: () => void
}

/** GEN-05: generated image shown in a modal/lightbox overlay. */
export function GeneratedImageModal({ signedUrl, onClose }: GeneratedImageModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagem gerada"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(9, 10, 20, 0.88)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          border: 'none',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
      <img
        src={signedUrl}
        alt="Imagem gerada"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '85vh',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}
