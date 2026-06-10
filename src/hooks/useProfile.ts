import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, type Profile } from '@/stores/auth.store'

type RecentItem = {
  id: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
}

type Dated = { created_at: string; prompty: RecentItem }
type CopyRow = { ref_id: string | null; created_at: string }
type JoinRow = { created_at: string; promptys?: RecentItem | RecentItem[] | null }

// Copies live in point_events (event_type='copy', ref_id=prompty) — no FK to
// promptys, so the prompty rows arrive separately and are matched here by id.
function datedFromCopies(copies: CopyRow[], promptys: RecentItem[]): Dated[] {
  const byId: Record<string, RecentItem> = {}
  for (const p of promptys) byId[p.id] = p
  return copies
    .map((c) => ({
      created_at: c.created_at,
      prompty: c.ref_id ? byId[c.ref_id] : undefined,
    }))
    .filter((d): d is Dated => !!d.prompty)
}

function datedFromJoins(rows: JoinRow[]): Dated[] {
  return rows
    .map((r) => ({
      created_at: r.created_at,
      prompty: Array.isArray(r.promptys) ? r.promptys[0] : (r.promptys ?? undefined),
    }))
    .filter((d): d is Dated => !!d.prompty)
}

// Distinct by prompty id, most recent use first
function distinctByRecency(items: Dated[]): RecentItem[] {
  const sorted = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const uniq: Record<string, RecentItem> = {}
  for (const d of sorted) uniq[d.prompty.id] ??= d.prompty
  return Object.values(uniq)
}

export function useProfile() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const [recents, setRecents] = useState<RecentItem[]>([])
  const [usedCount, setUsedCount] = useState(0)
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
        setUsedCount(0)
        return
      }
      setRecentsLoading(true)
      // Recents = union of copies + saves + tests, distinct by prompty_id, ordered desc.
      const [{ data: saves }, { data: tests }, { data: copies }] = await Promise.all([
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
        supabase
          .from('point_events')
          .select('ref_id, created_at')
          .eq('user_id', user.id)
          .eq('event_type', 'copy')
          .order('created_at', { ascending: false })
          .limit(12),
      ])

      const copyIds = (copies ?? []).map((c) => c.ref_id).filter((id): id is string => !!id)
      let copyPromptys: RecentItem[] = []
      if (copyIds.length > 0) {
        const { data } = await supabase
          .from('promptys')
          .select('id,title,cover_url,cover_gradient')
          .in('id', copyIds)
        copyPromptys = data ?? []
      }

      const distinct = distinctByRecency([
        ...datedFromCopies(copies ?? [], copyPromptys),
        ...datedFromJoins([...(saves ?? []), ...(tests ?? [])]),
      ])
      if (!cancelled) {
        setRecents(distinct.slice(0, 9))
        setUsedCount(distinct.length)
        setRecentsLoading(false)
      }
    }
    void loadRecents()
    return () => {
      cancelled = true
    }
  }, [user, profile?.points])

  return { profile, refetch, update, recents, usedCount, recentsLoading }
}
