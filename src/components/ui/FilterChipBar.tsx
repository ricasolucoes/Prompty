export interface FilterChipBarProps {
  options: ReadonlyArray<{ value: string; label: string }>
  value: string | null
  onChange: (value: string | null) => void
  ariaLabelPrefix?: string
}

export function FilterChipBar({
  options,
  value,
  onChange,
  ariaLabelPrefix = 'Filtro',
}: Readonly<FilterChipBarProps>) {
  return (
    <div
      role="group"
      aria-label={`${ariaLabelPrefix} filtros`}
      style={{
        display: 'flex',
        gap: 8,
        padding: '0 16px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        // Hide scrollbar (Firefox)
        scrollbarWidth: 'none',
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${opt.label} filtro`}
            onClick={() => onChange(isActive ? null : opt.value)}
            style={{
              flex: '0 0 auto',
              height: 36,
              padding: '8px 12px',
              borderRadius: 999,
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              background: isActive ? 'var(--primary)' : 'var(--surface-2)',
              border: `1px solid ${isActive ? 'var(--primary)' : 'var(--line)'}`,
              color: isActive ? '#fff' : 'var(--text-2)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
