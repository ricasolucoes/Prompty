import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useAuthStore } from '@/stores/auth.store'
import { levelOf } from '@/lib/constants/levels'

interface TabDef {
  to: string
  icon: IconName
  label: string
  minLevel: 'L1' | 'L2' | 'L3'
}

const TABS: TabDef[] = [
  { to: '/', icon: 'home', label: 'Feed', minLevel: 'L1' },
  { to: '/saved', icon: 'bookmark', label: 'Salvos', minLevel: 'L2' },
  { to: '/search', icon: 'search', label: 'Buscar', minLevel: 'L2' },
  { to: '/criar', icon: 'sparkle', label: 'Criar', minLevel: 'L3' },
  { to: '/ranking', icon: 'starFill', label: 'Ranking', minLevel: 'L3' },
  { to: '/profile', icon: 'user', label: 'Perfil', minLevel: 'L1' },
]

const LEVEL_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5']

function levelGteMin(currentLevel: string, minLevel: string): boolean {
  return LEVEL_ORDER.indexOf(currentLevel) >= LEVEL_ORDER.indexOf(minLevel)
}

export function TabBar() {
  const profile = useAuthStore((s) => s.profile)
  const currentLevelId = profile ? levelOf(profile.points ?? 0).id : 'L1'
  const visible = TABS.filter((t) => levelGteMin(currentLevelId, t.minLevel))

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '8px 16px env(safe-area-inset-bottom, 32px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          justifyContent: 'space-around',
          padding: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 22,
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(20px)',
          maxWidth: 430,
          width: '100%',
        }}
      >
        {visible.map((t) => {
          const isCriar = t.to === '/criar'
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              aria-label={isCriar ? 'Criar Prompty' : t.label}
              style={({ isActive }) =>
                isCriar
                  ? {
                      // Sparkle styling: 48x48 gradient pill, lifts -8px above bar
                      flex: '0 0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      marginTop: -8,
                      marginBottom: -8,
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #8B4DF5, #22D3EE)',
                      color: '#fff',
                      boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                      textDecoration: 'none',
                      fontSize: 0, // hide label visually; aria-label preserves a11y
                    }
                  : {
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px',
                      color: isActive ? 'var(--primary)' : 'var(--text-3)',
                      fontFamily: 'var(--font-sans, sans-serif)',
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'color 0.15s ease',
                    }
              }
            >
              {({ isActive }) =>
                isCriar ? (
                  <Icon name="sparkle" size={24} color="#fff" strokeWidth={2.2} />
                ) : (
                  <>
                    <Icon name={t.icon} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{t.label}</span>
                  </>
                )
              }
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
