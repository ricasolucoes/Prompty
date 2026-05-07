import { Icon } from '@/components/ui/Icon'
import { useAuthStore } from '@/stores/auth.store'
import { LEVELS, levelOf } from '@/lib/constants/levels'

export function AppHeader() {
  const profile = useAuthStore((s) => s.profile)
  const lvl = profile ? levelOf(profile.points ?? 0) : (LEVELS[0] ?? levelOf(0))
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '52px 16px 12px',
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
        <div
          style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #7C3AED, #22D3EE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <Icon name="wand" size={17} color="#fff" strokeWidth={2.4} />
        </div>
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
    </header>
  )
}
