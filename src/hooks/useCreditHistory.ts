import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export interface CreditEvent {
  id: string
  event_type: string
  delta: number
  created_at: string
  ref_id: string | null
}

export function useCreditHistory() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['credit_events', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<CreditEvent[]> => {
      const { data, error } = await supabase
        .from('credit_events')
        .select('id, event_type, delta, created_at, ref_id')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    },
  })
}
