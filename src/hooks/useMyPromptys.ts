import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export interface MyPromptyWithStats {
  id: string
  slug: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
  created_at: string
  copies: number
  saves: number
  feedbacks: number
}

async function fetchStats(
  promptyId: string,
): Promise<{ copies: number; saves: number; feedbacks: number }> {
  const [copies, saves, feedbacks] = await Promise.all([
    supabase
      .from('point_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'copy')
      .eq('ref_id', promptyId),
    supabase
      .from('prompty_saves')
      .select('*', { count: 'exact', head: true })
      .eq('prompty_id', promptyId),
    supabase
      .from('prompty_tests')
      .select('*', { count: 'exact', head: true })
      .eq('prompty_id', promptyId),
  ])
  return {
    copies: copies.count ?? 0,
    saves: saves.count ?? 0,
    feedbacks: feedbacks.count ?? 0,
  }
}

export function useMyPromptys() {
  const user = useAuthStore((s) => s.user)
  const [promptys, setPromptys] = useState<MyPromptyWithStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setPromptys([])
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from('promptys')
        .select('id, slug, title, cover_url, cover_gradient, created_at')
        .eq('author_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (error || !data) {
        setPromptys([])
        setLoading(false)
        return
      }

      const enriched = await Promise.all(
        data.map(async (p) => ({
          ...p,
          ...(await fetchStats(p.id)),
        })),
      )

      if (!cancelled) {
        setPromptys(enriched as MyPromptyWithStats[])
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  return { promptys, loading }
}
