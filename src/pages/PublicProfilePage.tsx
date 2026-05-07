import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!username) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle()
      if (cancelled) return
      if (error || !data) setNotFound(true)
      else setProfile(data as Profile)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [username])

  if (loading) return <main style={{ padding: 32 }}>Carregando…</main>

  if (notFound || !profile) {
    return (
      <main className="screen" style={{ padding: 32, textAlign: 'center', maxWidth: 430, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, fontSize: 22 }}>Perfil não encontrado</h1>
        <p style={{ marginTop: 8, color: 'var(--text-2)' }}>
          Este usuário ainda não definiu um @handle.{' '}
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700 }}>Voltar ao feed</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="screen" style={{ padding: '20px 16px 96px', maxWidth: 430, margin: '0 auto', textAlign: 'center' }}>
      <Avatar user={{ name: profile.name, avatar_url: profile.avatar_url }} size={88} />
      <h1 style={{ marginTop: 16, fontFamily: 'var(--font-display, sans-serif)', fontWeight: 700, fontSize: 22, letterSpacing: -0.4 }}>
        {profile.name ?? '—'}
      </h1>
      {profile.username && <p style={{ marginTop: 4, fontSize: 13.5, color: 'var(--text-3)' }}>@{profile.username}</p>}
      {profile.bio && <p style={{ marginTop: 12, fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.45 }}>{profile.bio}</p>}
      {/* L1+ public profiles never show points number; only level as a soft signal */}
      <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {profile.level}
      </div>
    </main>
  )
}
