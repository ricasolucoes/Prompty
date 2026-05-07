interface Props {
  value: number   // 0..max
  max?: number    // default 100
  height?: number // default 8
  className?: string
}

export function ProgressBar({ value, max = 100, height = 8, className }: Props) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #7C3AED, #22D3EE)',
          transition: 'width .4s ease',
        }}
      />
    </div>
  )
}
