import { useCreditHistory } from '@/hooks/useCreditHistory'

export interface CreditHistorySheetProps {
  open: boolean
  onClose: () => void
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  signup_bonus: 'Bônus de cadastro',
  earned_contribution: 'Crédito por contribuição',
  spent_generation: 'Geração de imagem',
  refund: 'Estorno',
  admin_grant: 'Concedido pelo time',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CreditHistorySheet({ open, onClose }: Readonly<CreditHistorySheetProps>) {
  const { data: events, isLoading } = useCreditHistory()

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Histórico de créditos"
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
          padding: '20px 20px 40px',
          animation: 'slideUp .25s cubic-bezier(.2, .8, .2, 1)',
          fontFamily: 'var(--font-sans, sans-serif)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 32,
            height: 4,
            background: 'var(--line-strong)',
            borderRadius: 2,
            margin: '0 auto 20px',
          }}
          aria-hidden="true"
        />

        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: 'var(--text-1)',
          }}
        >
          Histórico de créditos
        </h2>

        {isLoading && (
          <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Carregando…</p>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Nenhum evento ainda.</p>
        )}

        {!isLoading && events && events.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1
              const label = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
              const deltaPositive = event.delta > 0
              const deltaColor = deltaPositive ? '#34D399' : '#FF6B4A'
              const deltaText = deltaPositive ? `+${event.delta}` : `−${Math.abs(event.delta)}`

              return (
                <li
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: isLast ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--text-1)',
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 12,
                        color: 'var(--text-3)',
                      }}
                    >
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: deltaColor,
                      letterSpacing: 0.2,
                    }}
                  >
                    {deltaText}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
