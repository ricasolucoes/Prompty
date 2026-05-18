import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { WizardData } from '@/hooks/useCreatePrompty'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function WizardStep3Image({ data, onChange }: Readonly<Props>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    onChange({ coverFile: file })
    // Local preview via URL.createObjectURL (browser GC handles cleanup for MVP)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  function handleClear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    // exactOptionalPropertyTypes: use type assertion to clear optional File field
    onChange({ coverFile: undefined as unknown as File })
  }

  const hasImage = !!data.coverFile && !!previewUrl

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
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
          Imagem de capa
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {' '}
            · opcional — uma boa amostra ajuda no feed
          </span>
        </p>

        {hasImage && previewUrl ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '4/5',
              background: `url(${previewUrl}) center/cover no-repeat`,
              borderRadius: 12,
              border: '1px solid var(--line)',
              position: 'relative',
            }}
            role="img"
            aria-label="Pré-visualização da capa"
          >
            <button
              type="button"
              onClick={handleClear}
              aria-label="Remover imagem"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: 6,
                borderRadius: 999,
                background: 'rgba(20,20,30,0.7)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Icon name="x" size={16} color="#fff" />
            </button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              width: '100%',
              aspectRatio: '4/5',
              borderRadius: 12,
              border: '1px dashed var(--line-strong, var(--line))',
              background: 'var(--surface-2)',
              cursor: 'pointer',
              color: 'var(--text-3)',
            }}
          >
            <Icon name="image" size={32} color="var(--text-3)" />
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Toque para escolher uma imagem</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>JPG, PNG ou WebP até 2MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              style={{ display: 'none' }}
              aria-label="Imagem de capa"
            />
          </label>
        )}
      </div>
    </div>
  )
}
