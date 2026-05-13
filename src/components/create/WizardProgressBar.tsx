interface WizardProgressBarProps {
  step: number       // 0-indexed current step (0..3)
  totalSteps: number // 4 for Phase 3 wizard
}

export function WizardProgressBar({ step, totalSteps }: WizardProgressBarProps) {
  const completedCount = step + 1  // step 0 displays as "1 de 4"
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '0 16px',
        marginBottom: 16,
      }}
      aria-label={`Etapa ${completedCount} de ${totalSteps}`}
    >
      <div
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${totalSteps}, 1fr)`,
          gap: 4,
        }}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            style={{
              height: 4,
              borderRadius: 4,
              background:
                i <= step
                  ? 'linear-gradient(90deg, #7C3AED, #22D3EE)'
                  : 'var(--line)',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: 0.4,
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {completedCount} de {totalSteps}
      </span>
    </div>
  )
}
