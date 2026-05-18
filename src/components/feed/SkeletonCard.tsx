export function SkeletonCard() {
  return (
    <article
      className="screen"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
        marginBottom: 8,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <ShimmerBar width="40%" height={14} />
      <div style={{ height: 8 }} />
      <ShimmerBar width="80%" height={20} />
      <div style={{ height: 12 }} />
      <ShimmerBar width="100%" height={12} />
      <div style={{ height: 4 }} />
      <ShimmerBar width="95%" height={12} />
      <div style={{ height: 12 }} />
      <ShimmerBar width="100%" height={240} />
    </article>
  )
}

function ShimmerBar({ width, height }: Readonly<{ width: string; height: number }>) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 6,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'shimmer 1.4s linear infinite',
        }}
      />
    </div>
  )
}
