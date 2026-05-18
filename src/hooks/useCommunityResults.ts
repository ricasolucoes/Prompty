import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface CommunityResult {
  id: string
  image_url: string
  rating: number | null
  notes: string | null
  created_at: string
  user: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
}

type RawRow = {
  id: string
  image_url: string | null
  rating: number | null
  notes: string | null
  created_at: string
  user_id: string
  profiles:
    | { id: string; name: string | null; avatar_url: string | null }
    | { id: string; name: string | null; avatar_url: string | null }[]
    | null
}

function unwrapProfile(row: RawRow): CommunityResult['user'] {
  const p = row.profiles
  if (!p) return null
  const profile = Array.isArray(p) ? p[0] : p
  if (!profile) return null
  return { id: profile.id, name: profile.name, avatar_url: profile.avatar_url }
}

export function useCommunityResults(promptyId: string | null) {
  const [results, setResults] = useState<CommunityResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!promptyId) {
        setResults([])
        return
      }
      setLoading(true)
      const { data } = await supabase
        .from('prompty_tests')
        .select('id, image_url, rating, notes, created_at, user_id, profiles(id, name, avatar_url)')
        .eq('prompty_id', promptyId)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })

      if (cancelled) return

      const mapped: CommunityResult[] = (data ?? [])
        .filter((r) => typeof r.image_url === 'string' && r.image_url.length > 0)
        .map((r) => ({
          id: r.id,
          image_url: r.image_url,
          rating: r.rating,
          notes: r.notes,
          created_at: r.created_at,
          user: unwrapProfile(r),
        }))

      setResults(mapped)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [promptyId])

  return { results, loading }
}
