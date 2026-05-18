import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PrimaryButton } from '@/components/ui/PrimaryButton'

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    const r = await resetPassword(email)
    setBusy(false)
    if (r.error) {
      setErr(r.error)
      return
    }
    setDone(true)
  }

  return (
    <main
      className="screen"
      style={{ padding: '80px 24px 24px', minHeight: '100vh', maxWidth: 430, margin: '0 auto' }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display, sans-serif)',
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: -0.4,
        }}
      >
        Recuperar senha
      </h1>
      {!done ? (
        <form
          onSubmit={(e) => {
            void onSubmit(e)
          }}
          style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            autoComplete="email"
            style={{
              padding: '12px 16px',
              borderRadius: 14,
              border: '1px solid var(--line)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: 13.5,
            }}
            aria-label="E-mail"
          />
          {err && (
            <p role="alert" style={{ color: '#FF3B6B', fontSize: 13.5 }}>
              {err}
            </p>
          )}
          <PrimaryButton type="submit" full disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar link'}
          </PrimaryButton>
        </form>
      ) : (
        <p
          role="status"
          style={{ marginTop: 24, color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.5 }}
        >
          Enviamos um link para o seu e-mail. Abra para definir uma nova senha.
        </p>
      )}
      <p style={{ marginTop: 16, fontSize: 13.5 }}>
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Voltar
        </Link>
      </p>
    </main>
  )
}
