import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export type GenState = 'idle' | 'loading' | 'done' | 'error'

export function useGenerate() {
  const [state, setState] = useState<GenState>('idle')
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inFlight = useRef(false) // GEN-03: synchronous guard against double-invoke

  async function generate(promptyId: string, renderedPrompt: string): Promise<void> {
    if (inFlight.current) return // second rapid click is a no-op
    inFlight.current = true
    setState('loading')
    setSignedUrl(null)
    setErrorMsg(null)

    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompty_id: promptyId, rendered_prompt: renderedPrompt },
    })

    // Server is the source of truth for credits — refetch on every outcome.
    void useAuthStore.getState().refetchProfile()
    inFlight.current = false

    if (error || !data?.signed_url) {
      setErrorMsg(data?.error ?? error?.message ?? 'Erro ao gerar imagem')
      setState('error')
      return
    }
    setSignedUrl(data.signed_url)
    setState('done')
  }

  return { generate, state, signedUrl, errorMsg, reset: () => setState('idle') }
}
