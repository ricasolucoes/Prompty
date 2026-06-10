import { useEffect } from 'react'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import type { Level } from '@/lib/constants/levels'

interface Props {
  level: Level
  onDismiss: () => void
}

// LEVL-03: When user reaches L2 (Curador), the modal lists what's now unlocked.
// The four bullets mirror the requirement wording: "salvar favoritos, avaliar
// promptys e enviar imagens geradas" — surfacing both the SOCL-01 save UI (now
// available via the prompty detail page from Plan 01-10) and the Phase 2
// curator features (CUR-01 image upload, CUR-02 ratings).
const UNLOCKS: Partial<Record<Level['id'], string[]>> = {
  L2: [
    'Buscar Promptys por estilo',
    'Salvar favoritos na sua biblioteca',
    'Avaliar Promptys e enviar imagens geradas',
    'Seguir criadores',
  ],
  L3: ['Criar e publicar Promptys', 'Ver estatísticas dos seus Promptys', 'Variações simples'],
}

function UnlockList({ items }: Readonly<{ items: string[] }>) {
  if (items.length === 0) return null
  return (
    <ul
      style={{
        textAlign: 'left',
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        fontSize: 13.5,
        lineHeight: 1.55,
        color: 'var(--text-2)',
        listStylePosition: 'inside',
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

// Every level reached grants 1 AI credit (migration 009)
function CreditBanner() {
  return (
    <p
      style={{
        marginTop: 12,
        padding: '8px 12px',
        borderRadius: 12,
        background: 'var(--primary-soft)',
        color: 'var(--primary)',
        fontSize: 13.5,
        fontWeight: 700,
      }}
    >
      🎁 Você ganhou +1 Crédito de IA
    </p>
  )
}

export function LevelUpModal({ level, onDismiss }: Readonly<Props>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  const unlockedItems = UNLOCKS[level.id] ?? []
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Novo nível desbloqueado"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.75)',
        animation: 'fadeIn .25s',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 340,
          background: 'var(--surface)',
          borderRadius: 24,
          padding: '32px 24px 24px',
          textAlign: 'center',
          animation: 'pop .35s cubic-bezier(.2, 1.4, .4, 1)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: level.color,
          }}
        >
          Novo nível
        </p>
        <div style={{ fontSize: 64, lineHeight: 1, margin: '8px 0' }} aria-hidden="true">
          {level.emoji}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: -0.8,
            color: 'var(--text-1)',
          }}
        >
          {level.name}
        </h2>
        <p style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.45, color: 'var(--text-2)' }}>
          {level.desc}
        </p>

        <CreditBanner />

        <UnlockList items={unlockedItems} />

        <div style={{ marginTop: 16 }}>
          <PrimaryButton full icon="sparkle" color={level.color} onClick={onDismiss}>
            Continuar explorando
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
