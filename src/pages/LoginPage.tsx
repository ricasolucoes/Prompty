import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

export function LoginPage() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const r = await signIn(email, password)
    setBusy(false)
    if (r.error) { setErr(r.error); return }
    nav('/', { replace: true })
  }

  return (
    <main className="screen" style={{ padding: '80px 24px 24px', minHeight: '100vh', maxWidth: 430, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, fontSize: 22, letterSpacing: -0.4 }}>Entrar</h1>
      <form onSubmit={onSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com" autoComplete="email"
          style={inputStyle()}
          aria-label="E-mail"
        />
        <input
          type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="senha" autoComplete="current-password"
          style={inputStyle()}
          aria-label="Senha"
        />
        {err && <p role="alert" style={{ color: '#FF3B6B', fontSize: 13.5 }}>{err}</p>}
        <PrimaryButton type="submit" full disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</PrimaryButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 13.5, color: 'var(--text-2)' }}>
        Não tem conta? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>Criar conta</Link>
      </p>
      <p style={{ marginTop: 8, fontSize: 13.5, color: 'var(--text-2)' }}>
        <Link to="/reset-password" style={{ color: 'var(--text-2)' }}>Esqueci a senha</Link>
      </p>
    </main>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    borderRadius: 14,
    border: '1px solid var(--line)',
    background: 'var(--surface-2)',
    color: 'var(--text-1)',
    fontFamily: 'var(--font-sans, sans-serif)',
    fontSize: 13.5,
  }
}
