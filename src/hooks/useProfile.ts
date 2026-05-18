import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, type Profile } from '@/stores/auth.store'

type RecentItem = {
  id: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
}

export function useProfile() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [recents, setRecents] = useState<RecentItem[]>([])
  const [recentsLoading, setRecentsLoading] = useState(false)

  async function refetch() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (data) setProfile(data)
  }

  async function update(
    patch: Partial<Pick<Profile, 'username' | 'name' | 'bio' | 'avatar_url'>>,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!user) return { ok: false, error: 'Não autenticado' }
    const { error, data } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (data) setProfile(data)
    return { ok: true }
  }

  useEffect(() => {
    let cancelled = false
    async function loadRecents() {
      if (!user) {
        setRecents([])
        return
      }
      setRecentsLoading(true)
      // Recents = union of saves + tests, distinct by prompty_id, ordered desc
      const [{ data: saves }, { data: tests }] = await Promise.all([
        supabase
          .from('prompty_saves')
          .select('prompty_id, created_at, promptys(id,title,cover_url,cover_gradient)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('prompty_tests')
          .select('prompty_id, created_at, promptys(id,title,cover_url,cover_gradient)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(12),
      ])
      const merged = [...(saves ?? []), ...(tests ?? [])]
        .map((r: { promptys?: RecentItem | RecentItem[] | null }) =>
          Array.isArray(r.promptys) ? r.promptys[0] : r.promptys,
        )
        .filter((p): p is RecentItem => !!p)
      const uniq: Record<string, RecentItem> = {}
      for (const p of merged) uniq[p.id] = p
      if (!cancelled) {
        setRecents(Object.values(uniq).slice(0, 9))
        setRecentsLoading(false)
      }
    }
    void loadRecents()
    return () => {
      cancelled = true
    }
  }, [user, profile?.points])

  return { profile, refetch, update, recents, recentsLoading }
}
