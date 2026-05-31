import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/stores/auth.store'
import { LEVELS, levelOf } from '@/lib/constants/levels'
import { useCredits } from '@/hooks/useCredits'

export function AppHeader() {
  const profile = useAuthStore((s) => s.profile)
  const lvl = profile ? levelOf(profile.points ?? 0) : (LEVELS[0] ?? levelOf(0))
  const { credits } = useCredits()
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: 'max(52px, calc(env(safe-area-inset-top, 0px) + 12px)) 16px 12px',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Logo size={30} radius={9} />
        <span
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: -0.5,
            color: 'var(--text-1)',
          }}
        >
          Promptys
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          aria-label={`${credits} crédito${credits === 1 ? '' : 's'}`}
          style={{
            padding: '4px 8px',
            borderRadius: 999,
            background: 'rgba(255,107,74,0.12)',
            color: '#FF6B4A',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span aria-hidden="true">🎟</span>
          {credits}
        </div>

        <div
          style={{
            padding: '4px 8px',
            borderRadius: 999,
            background: lvl.id === 'L1' ? 'rgba(34,211,238,0.12)' : 'var(--primary-soft)',
            color: lvl.id === 'L1' ? '#22D3EE' : 'var(--primary)',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {lvl.name}
        </div>
      </div>
    </header>
  )
}
