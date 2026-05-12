import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export interface ReportSubmitInput {
  prompty_id: string
  type: 'report' | 'category_suggestion'
  reason: string
  notes?: string
}

export function useReport() {
  async function submit(input: ReportSubmitInput): Promise<{ ok: boolean; error?: string }> {
    const user = useAuthStore.getState().user
    if (!user) return { ok: false, error: 'Faça login para enviar.' }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      prompty_id: input.prompty_id,
      type: input.type,
      reason: input.reason,
      notes: input.notes ?? null,
    })

    if (error) {
      // Unique constraint violation (same user already reported / suggested for this prompty)
      // surfaces as a friendly error. RLS denial would also land here.
      return { ok: false, error: 'Não foi possível enviar.' }
    }
    return { ok: true }
  }
  return { submit }
}
