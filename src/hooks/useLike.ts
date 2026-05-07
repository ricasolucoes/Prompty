import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useLike(promptyId: string) {
  const user = useAuthStore((s) => s.user)
  const [liked, setLiked] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) { setLiked(false); setHydrated(true); return }
      const { data } = await supabase
        .from('prompty_likes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('prompty_id', promptyId)
        .maybeSingle()
      if (!cancelled) { setLiked(!!data); setHydrated(true) }
    }
    load()
    return () => { cancelled = true }
  }, [user, promptyId])

  async function toggle() {
    if (!user) return
    const next = !liked
    setLiked(next) // optimistic
    const { error } = next
      ? await supabase.from('prompty_likes').insert({ user_id: user.id, prompty_id: promptyId })
      : await supabase.from('prompty_likes').delete().match({ user_id: user.id, prompty_id: promptyId })
    if (error) {
      setLiked(!next) // revert on error
    }
  }

  return { liked, toggle, isAuthenticated: !!user, hydrated }
}
