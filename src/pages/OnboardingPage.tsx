import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

const ONBOARD_KEY = 'promptys-onboarded'

export function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARD_KEY) === '1' }
  catch { return false }
}
export function markOnboarded() {
  try { localStorage.setItem(ONBOARD_KEY, '1') } catch { /* ignore */ }
}

export function OnboardingPage() {
  const nav = useNavigate()
  function start() {
    markOnboarded()
    nav('/', { replace: true })
  }
  return (
    <main className="screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '80px 28px 28px', background: 'var(--bg)' }}>
      <div
        style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, #7C3AED, #22D3EE)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 36px rgba(124,58,237,0.35)',
        }}
        aria-hidden="true"
      >
        <Icon name="wand" size={32} color="#fff" strokeWidth={2.4} />
      </div>

      <h1
        style={{
          marginTop: 32,
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 22,
          lineHeight: 1.05,
          letterSpacing: -1.2,
          color: 'var(--text-1)',
          whiteSpace: 'pre-line',
        }}
      >
        Receitas prontas para criar imagens com IA.
      </h1>

      <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-2)', marginTop: 16 }}>
        Toque em um Prompty, copie o texto, cole no <strong>Gemini</strong> ou outro app de IA, e veja o resultado. Depois volte e conte como ficou.
      </p>

      <div style={{ flex: 1 }} />

      <PrimaryButton full icon="sparkle" onClick={start}>Começar a explorar</PrimaryButton>

      <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
        Sem cadastro, sem cartão. Entre direto no feed.
      </p>
    </main>
  )
}
