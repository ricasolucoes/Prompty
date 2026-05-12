import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export interface SavedItem {
  prompty_id: string
  created_at: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
  slug: string
}

export interface ResultItem extends SavedItem {
  image_url: string
  rating: number | null
}

type PromptyJoin = {
  id: string
  title: string
  cover_url: string | null
  cover_gradient: string | null
  slug: string
}

function unwrapPrompty(row: { promptys?: PromptyJoin | PromptyJoin[] | null }): PromptyJoin | null {
  const p = row.promptys
  if (!p) return null
  return Array.isArray(p) ? p[0] ?? null : p
}

export function useSaved() {
  const user = useAuthStore((s) => s.user)
  const [saves, setSaves] = useState<SavedItem[]>([])
  const [ratings, setRatings] = useState<SavedItem[]>([])
  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setSaves([])
        setRatings([])
        setResults([])
        return
      }
      setLoading(true)
      const [savesRes, testsRes] = await Promise.all([
        supabase
          .from('prompty_saves')
          .select('prompty_id, created_at, promptys(id,title,cover_url,cover_gradient,slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('prompty_tests')
          .select('prompty_id, created_at, image_url, rating, promptys(id,title,cover_url,cover_gradient,slug)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return

      const savedItems: SavedItem[] = (savesRes.data ?? [])
        .map((r) => {
          const p = unwrapPrompty(r as { promptys?: PromptyJoin | PromptyJoin[] | null })
          if (!p) return null
          return {
            prompty_id: (r as { prompty_id: string }).prompty_id,
            created_at: (r as { created_at: string }).created_at,
            title: p.title,
            cover_url: p.cover_url,
            cover_gradient: p.cover_gradient,
            slug: p.slug,
          }
        })
        .filter((x): x is SavedItem => x !== null)

      const ratingItems: SavedItem[] = (testsRes.data ?? [])
        .map((r) => {
          const p = unwrapPrompty(r as { promptys?: PromptyJoin | PromptyJoin[] | null })
          if (!p) return null
          return {
            prompty_id: (r as { prompty_id: string }).prompty_id,
            created_at: (r as { created_at: string }).created_at,
            title: p.title,
            cover_url: p.cover_url,
            cover_gradient: p.cover_gradient,
            slug: p.slug,
          }
        })
        .filter((x): x is SavedItem => x !== null)

      const resultItems: ResultItem[] = (testsRes.data ?? [])
        .filter((r) => {
          const row = r as { image_url?: string | null }
          return typeof row.image_url === 'string' && row.image_url.length > 0
        })
        .map((r) => {
          const row = r as { prompty_id: string; created_at: string; image_url: string; rating?: number | null; promptys?: PromptyJoin | PromptyJoin[] | null }
          const p = unwrapPrompty({ promptys: row.promptys ?? null })
          if (!p) return null
          return {
            prompty_id: row.prompty_id,
            created_at: row.created_at,
            title: p.title,
            cover_url: p.cover_url,
            cover_gradient: p.cover_gradient,
            slug: p.slug,
            image_url: row.image_url,
            rating: row.rating ?? null,
          }
        })
        .filter((x): x is ResultItem => x !== null)

      setSaves(savedItems)
      setRatings(ratingItems)
      setResults(resultItems)
      setLoading(false)
    }

    void load()
    return () => { cancelled = true }
  }, [user])

  return { saves, ratings, results, loading }
}
