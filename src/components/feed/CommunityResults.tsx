import { useState } from 'react'
import { useCommunityResults, type CommunityResult } from '@/hooks/useCommunityResults'
import { FullImageModal } from './FullImageModal'

interface Props {
  promptyId: string
}

export function CommunityResults({ promptyId }: Readonly<Props>) {
  const { results } = useCommunityResults(promptyId)
  const [openResult, setOpenResult] = useState<CommunityResult | null>(null)

  // Per UI-SPEC: section is absent (not empty-state) when there are no results.
  if (results.length === 0) return null

  return (
    <section
      aria-label="Resultados da comunidade"
      style={{
        padding: '16px 16px 24px',
        animation: 'fadeIn .25s',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          RESULTADOS DA COMUNIDADE
        </h2>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--primary)',
            background: 'var(--primary-soft, rgba(124,58,237,0.12))',
            padding: '4px 8px',
            borderRadius: 999,
          }}
          aria-label={`${results.length} resultados`}
        >
          {results.length}
        </span>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}
      >
        {results.map((r) => {
          const userName = r.user?.name ?? 'Anônimo'
          return (
            <button
              key={r.id}
              type="button"
              aria-label={`Ver resultado de ${userName}`}
              onClick={() => setOpenResult(r)}
              style={{
                aspectRatio: '1/1',
                borderRadius: 8,
                overflow: 'hidden',
                border: 'none',
                padding: 0,
                background: `url(${r.image_url}) center/cover no-repeat, var(--surface-2)`,
                cursor: 'pointer',
              }}
            />
          )
        })}
      </div>

      <FullImageModal result={openResult} onClose={() => setOpenResult(null)} />
    </section>
  )
}
