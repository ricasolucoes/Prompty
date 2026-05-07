import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { compressToWebP } from '@/lib/images/compress'

export interface TestSubmitInput {
  prompty_id: string
  rating: number
  notes?: string
  image?: File
}

async function uploadResultImage(userId: string, promptyId: string, file: File): Promise<string | null> {
  const blob = await compressToWebP(file, 200, 0.85)
  const ts = Date.now()
  const path = `${userId}/${promptyId}-${ts}.webp`
  const { error } = await supabase.storage
    .from('prompty-results')
    .upload(path, blob, { contentType: 'image/webp', upsert: false })
  if (error) {
    // Don't block the rating; just return null url
    console.warn('Image upload failed:', error.message)
    return null
  }
  const { data } = supabase.storage.from('prompty-results').getPublicUrl(path)
  return data.publicUrl ?? null
}

export function useTest() {
  async function submit(input: TestSubmitInput): Promise<{ ok: boolean; error?: string }> {
    const user = useAuthStore.getState().user
    if (!user) return { ok: false, error: 'Faça login para avaliar.' }
    if (input.rating < 1 || input.rating > 5) return { ok: false, error: 'Selecione uma nota de 1 a 5.' }

    let image_url: string | null = null
    if (input.image) {
      image_url = await uploadResultImage(user.id, input.prompty_id, input.image)
    }

    const { error } = await supabase.from('prompty_tests').insert({
      prompty_id: input.prompty_id,
      user_id: user.id,
      rating: input.rating,
      notes: input.notes ?? null,
      image_url,
    })
    if (error) return { ok: false, error: 'Não foi possível enviar a avaliação.' }
    // The SQL trigger awards +5p and updates profiles.points/level automatically.
    return { ok: true }
  }
  return { submit }
}
