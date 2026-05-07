import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Status = 'connecting' | 'ok' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('connecting')
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    supabase
      .rpc('version')
      .then(({ data, error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('ok')
          setVersion(String(data ?? ''))
        }
      })
  }, [])

  const dot: Record<Status, string> = {
    connecting: '🟡',
    ok: '🟢',
    error: '🔴',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <svg width={48} height={48} viewBox="0 0 32 32" fill="none">
        <rect x="2" y="4" width="22" height="22" rx="6" fill="url(#lg)"/>
        <path d="M9 12h2m10 0h2M9 17h2m10 0h2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="26" cy="6" r="3.5" fill="#22D3EE"/>
        <path d="M26 4l.6 1.4L28 6l-1.4.6L26 8l-.6-1.4L24 6l1.4-.6z" fill="#fff"/>
        <defs>
          <linearGradient id="lg" x1="2" y1="4" x2="24" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7C3AED"/>
            <stop offset="1" stopColor="#22D3EE"/>
          </linearGradient>
        </defs>
      </svg>

      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -1, color: '#f5f7fa' }}>
        Promptys
      </h1>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        fontSize: 13,
        color: '#b0b5c5',
      }}>
        {dot[status]} Supabase —{' '}
        {status === 'connecting' && 'conectando…'}
        {status === 'ok' && `conectado ${version ? `· ${version.split(' ')[1] ?? ''}` : ''}`}
        {status === 'error' && 'erro de conexão'}
      </div>
    </div>
  )
}
