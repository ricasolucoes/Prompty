import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { LEVELS } from '@/lib/constants/levels'

/**
 * Dev-only debug panel. Renders ONLY when `import.meta.env.DEV` is true.
 * Allows quick theme toggle and a "force level" preview without earning real points.
 */
export function TweaksPanel() {
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [open, setOpen] = useState(true)

  function setForcedLevel(levelId: 'L1' | 'L2' | 'L3') {
    const level = LEVELS.find((l) => l.id === levelId) ?? { id: levelId, min: 0 }
    // Synthetic profile so the rest of the app renders that level.
    const base = profile ?? ({
      id: '__dev__',
      name: 'Dev',
      username: 'dev',
      avatar_url: null,
      bio: null,
      level: 'L1',
      points: 0,
      streak: 0,
      verified: false,
      created_at: new Date().toISOString(),
    } as never)
    setProfile({ ...base, level: level.id, points: level.min })
  }

  const currentForcedLevel = profile?.level ?? 'L1'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir painel de dev"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 2147483646,
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'rgba(20,20,30,0.85)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        DEV
      </button>
    )
  }

  return (
    <aside
      aria-label="Painel de tweaks (dev)"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 2147483646,
        width: 240,
        padding: 12,
        background: 'rgba(20,20,30,0.92)',
        color: '#fff',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong style={{ fontWeight: 700 }}>DEV TWEAKS</strong>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
          }}
          aria-label="Fechar painel"
        >
          ×
        </button>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0',
        }}
      >
        <span>Tema</span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Alternar tema (atual: ${theme})`}
          style={{
            background: theme === 'dark' ? '#9D6BFA' : '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {theme === 'dark' ? 'DARK' : 'LIGHT'}
        </button>
      </label>

      <div style={{ marginTop: 8 }}>
        <p style={{ margin: 0, opacity: 0.7, marginBottom: 4 }}>Forçar nível</p>
        <div
          role="radiogroup"
          aria-label="Forçar nível"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}
        >
          {(['L1', 'L2', 'L3'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={currentForcedLevel === id}
              onClick={() => setForcedLevel(id)}
              style={{
                background: currentForcedLevel === id ? '#22D3EE' : 'rgba(255,255,255,0.10)',
                color: currentForcedLevel === id ? '#0E0F18' : '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 4px',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {id}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 6, opacity: 0.6, fontSize: 10, lineHeight: 1.3 }}>
          Apenas preview. Não altera pontos reais no banco.
        </p>
      </div>
    </aside>
  )
}
