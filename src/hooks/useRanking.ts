import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

// Public, leaderboard-safe slice of a profile. Deliberately excludes is_admin,
// bio, streak and last_active_at — only what the ranking surface should reveal.
export interface RankingEntry {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
  level: string
  points: number
  verified: boolean
}

const TOP_LIMIT = 100

/**
 * All-time points leaderboard (GAME2-01). profiles.points is the server-authoritative
 * gamification total (RLS: profiles_select_all), so the top list is readable client-side.
 * point_events stays owner-only (RLS), so a weekly ranking would need a server view — deferred.
 *
 * Returns the top entries plus the current user's global 1-based rank (`myRank`), resolved
 * from the visible list when present, otherwise via a count of profiles that outrank them.
 */
export function useRanking() {
  const user = useAuthStore((s) => s.user)
  const myPoints = useAuthStore((s) => s.profile?.points ?? 0)

  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, level, points, verified')
        .gt('points', 0)
        .order('points', { ascending: false })
        .order('created_at', { ascending: true }) // stable tiebreaker: earlier joiners rank higher
        .limit(TOP_LIMIT)
      const list = (data ?? []) as RankingEntry[]

      let rank: number | null = null
      if (user) {
        const idx = list.findIndex((e) => e.id === user.id)
        if (idx >= 0) {
          rank = idx + 1
        } else if (myPoints > 0) {
          // Outside the visible top list — count how many profiles strictly outrank us.
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('points', myPoints)
          rank = (count ?? 0) + 1
        }
      }

      if (!cancelled) {
        setEntries(list)
        setMyRank(rank)
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user, myPoints])

  return { entries, loading, myRank }
}
