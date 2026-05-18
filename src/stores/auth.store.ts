import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export interface AuthStore {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
  refetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, loading: false }),
  refetchProfile: async () => {
    const { user } = useAuthStore.getState()
    if (!user) return
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!error && data) {
      useAuthStore.getState().setProfile(data)
    }
  },
}))
