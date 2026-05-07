import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useSave(promptyId: string) {
  const user = useAuthStore((s) => s.user)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) { setSaved(false); return }
      const { data } = await supabase
        .from('prompty_saves')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('prompty_id', promptyId)
        .maybeSingle()
      if (!cancelled) setSaved(!!data)
    }
    load()
    return () => { cancelled = true }
  }, [user, promptyId])

  async function toggle() {
    if (!user) return
    const next = !saved
    setSaved(next) // optimistic
    const { error } = next
      ? await supabase.from('prompty_saves').insert({ user_id: user.id, prompty_id: promptyId })
      : await supabase.from('prompty_saves').delete().match({ user_id: user.id, prompty_id: promptyId })
    if (error) setSaved(!next) // revert on error
  }

  return { saved, toggle }
}
