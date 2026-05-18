import { useEffect, useRef, useState } from 'react'
import { useSearch, type SearchItem } from '@/hooks/useSearch'
import { FilterChipBar } from '@/components/ui/FilterChipBar'
import { FeedCard } from '@/components/feed/FeedCard'
import { SkeletonCard } from '@/components/feed/SkeletonCard'
import { Icon } from '@/components/ui/Icon'
import { CATEGORIES, MODELS } from '@/lib/constants/categories'

const COLOR_TEXT_3 = 'var(--text-3)'

// eslint-disable-next-line max-lines-per-function, complexity -- page-level shell; refactor deferred
export function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, enabled } = useSearch(
    debouncedQuery,
    category,
    model,
  )
  const items: SearchItem[] = pages.flat()

  function handleQueryChange(value: string) {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 300)
  }

  function handleClear() {
    setQuery('')
    setDebouncedQuery('')
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Infinite scroll (mirrors FeedPage)
  useEffect(() => {
    function onScroll() {
      if (!hasNextPage || isFetchingNextPage) return
      const nearBottom = window.innerHeight + window.scrollY > document.body.offsetHeight - 600
      if (nearBottom) fetchNextPage()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const showIdle = !enabled && !isLoading
  const showNoResults = enabled && !isLoading && items.length === 0
  const hasFilters = !!category || !!model

  return (
    <section className="screen" style={{ paddingBottom: 96 }}>
      {/* Search input */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: COLOR_TEXT_3,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <Icon name="search" size={18} />
          </span>
          <input
            type="search"
            role="searchbox"
            aria-label="Buscar Promptys"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Buscar Promptys…"
            style={{
              width: '100%',
              height: 44,
              boxSizing: 'border-box',
              padding: '12px 44px 12px 44px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              color: 'var(--text-1)',
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: 13.5,
              fontWeight: 400,
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: COLOR_TEXT_3,
                padding: 4,
              }}
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div style={{ padding: '16px 16px 0' }}>
        <p
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: COLOR_TEXT_3,
          }}
        >
          CATEGORIA
        </p>
      </div>
      <FilterChipBar
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        value={category}
        onChange={setCategory}
        ariaLabelPrefix="Categoria"
      />

      {/* Model chips */}
      <div style={{ padding: '8px 16px 0' }}>
        <p
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: COLOR_TEXT_3,
          }}
        >
          MODELO
        </p>
      </div>
      <FilterChipBar
        options={MODELS.map((m) => ({ value: m, label: m }))}
        value={model}
        onChange={setModel}
        ariaLabelPrefix="Modelo"
      />

      {/* Results count */}
      {items.length > 0 && (debouncedQuery || hasFilters) && (
        <p
          aria-live="polite"
          style={{
            padding: '8px 16px 0',
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: COLOR_TEXT_3,
          }}
        >
          {items.length === 1 ? '1 resultado' : `${items.length} resultados`}
        </p>
      )}

      {/* Loading skeletons (initial) */}
      {isLoading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Idle empty state */}
      {showIdle && (
        <EmptyState
          icon="search"
          heading="Buscar Promptys"
          body="Digite uma palavra-chave ou escolha uma categoria acima."
        />
      )}

      {/* No results */}
      {showNoResults && (
        <EmptyState
          icon="search"
          heading="Nenhum resultado"
          body="Tente outras palavras ou remova os filtros."
        />
      )}

      {/* Results */}
      {items.map((p) => (
        <FeedCard key={p.id} prompty={p} />
      ))}

      {isFetchingNextPage && <SkeletonCard />}
    </section>
  )
}

function EmptyState({
  icon,
  heading,
  body,
}: Readonly<{ icon: 'search' | 'x'; heading: string; body: string }>) {
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
      <Icon name={icon} size={36} color="var(--text-3)" />
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 19,
          fontWeight: 700,
          color: 'var(--text-1)',
        }}
      >
        {heading}
      </h2>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{body}</p>
    </div>
  )
}
