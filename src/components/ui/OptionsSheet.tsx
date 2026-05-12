import { Icon, type IconName } from '@/components/ui/Icon'

export interface OptionsSheetOption {
  label: string
  icon: IconName
  onClick: () => void
  destructive?: boolean
}

export interface OptionsSheetProps {
  open: boolean
  onClose: () => void
  options: OptionsSheetOption[]
  ariaLabel?: string
}

export function OptionsSheet({ open, onClose, options, ariaLabel = 'Opções' }: OptionsSheetProps) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        animation: 'fadeIn .2s',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 32px',
          animation: 'slideUp .25s cubic-bezier(.2, .8, .2, 1)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 32,
            height: 4,
            background: 'var(--line-strong)',
            borderRadius: 2,
            margin: '0 auto 16px',
          }}
          aria-hidden="true"
        />

        {/* Option list */}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {options.map((opt, idx) => {
            const isLast = idx === options.length - 1
            const color = opt.destructive === true ? '#FF3B6B' : 'var(--text-1)'
            const iconColor = opt.destructive === true ? '#FF3B6B' : 'var(--text-2)'
            return (
              <li key={`${opt.label}-${idx}`}>
                <button
                  type="button"
                  onClick={() => {
                    opt.onClick()
                    onClose()
                  }}
                  data-destructive={opt.destructive === true ? 'true' : 'false'}
                  style={{
                    width: '100%',
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isLast ? 'none' : '1px solid var(--line)',
                    cursor: 'pointer',
                    color,
                    fontFamily: 'var(--font-sans, sans-serif)',
                    fontSize: 13.5,
                    fontWeight: 400,
                    textAlign: 'left',
                  }}
                >
                  <Icon name={opt.icon} size={20} color={iconColor} />
                  <span>{opt.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
