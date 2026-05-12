import { useState } from 'react'
import { useSaved } from '@/hooks/useSaved'
import { FilterChipBar } from '@/components/ui/FilterChipBar'
import { SavedCard } from '@/components/feed/SavedCard'
import { Icon, type IconName } from '@/components/ui/Icon'

const CHIPS = [
  { value: 'saves',   label: 'Salvos'      },
  { value: 'ratings', label: 'Avaliações'  },
  { value: 'results', label: 'Resultados'  },
] as const

type ChipValue = 'saves' | 'ratings' | 'results'

interface EmptyStateConfig {
  icon: IconName
  heading: string
  body: string
}

const EMPTY: Record<ChipValue, EmptyStateConfig> = {
  saves: {
    icon: 'bookmark',
    heading: 'Nenhum prompty salvo ainda',
    body: 'Salve promptys que você gostou pelo botão Salvar na página de detalhes.',
  },
  ratings: {
    icon: 'star',
    heading: 'Nenhuma avaliação ainda',
    body: 'Quando avaliar um Prompty, ele aparece aqui.',
  },
  results: {
    icon: 'image',
    heading: 'Nenhum resultado enviado ainda',
    body: 'Envie uma imagem gerada ao avaliar um Prompty — ela aparece aqui.',
  },
}

export function SavedPage() {
  const [chip, setChip] = useState<ChipValue>('saves')
  const { saves, ratings, results, loading } = useSaved()

  function handleChipChange(value: string | null) {
    // FilterChipBar single-select can pass null when toggling off — coerce to 'saves' default
    if (value === 'saves' || value === 'ratings' || value === 'results') {
      setChip(value)
    }
    // Tapping the active chip again toggles off (value === null) — we ignore this to keep always-one-active for SavedPage UX.
  }

  const items =
    chip === 'saves' ? saves :
    chip === 'ratings' ? ratings :
    results

  const isEmpty = !loading && items.length === 0
  const emptyConfig = EMPTY[chip]

  return (
    <section className="screen" style={{ paddingBottom: 96 }}>
      {/* Heading (visually hidden but useful for screen readers / parity with UI-SPEC) */}
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', margin: 0 }}>
        Salvos
      </h1>

      {/* Filter chip bar */}
      <div style={{ padding: '12px 0 12px' }}>
        <FilterChipBar
          options={CHIPS.map((c) => ({ value: c.value, label: c.label }))}
          value={chip}
          onChange={handleChipChange}
          ariaLabelPrefix="Aba"
        />
      </div>

      {/* Empty state */}
      {isEmpty && (
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
          <Icon name={emptyConfig.icon} size={36} color="var(--text-3)" />
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: 19,
              fontWeight: 700,
              color: 'var(--text-1)',
            }}
          >
            {emptyConfig.heading}
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4 }}>
            {emptyConfig.body}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isEmpty && (
        <div
          style={{
            padding: '0 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
          aria-label={`Grade de promptys — ${CHIPS.find((c) => c.value === chip)?.label ?? ''}`}
        >
          {items.map((item) => (
            <SavedCard
              key={`${chip}-${item.prompty_id}-${item.created_at}`}
              slug={item.slug}
              title={item.title}
              cover_url={item.cover_url}
              cover_gradient={item.cover_gradient}
              result_image_url={chip === 'results' && 'image_url' in item ? (item as { image_url: string }).image_url : null}
            />
          ))}
        </div>
      )}
    </section>
  )
}
