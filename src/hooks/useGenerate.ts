import { useRef, useState } from 'react'
import * as Sentry from '@sentry/react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export type GenState = 'idle' | 'loading' | 'done' | 'error'

interface GenerateResponse {
  signed_url?: string
  error?: string
  balance?: number
  refunded?: boolean
}

/** Build the user-facing message and report the failure to Sentry. */
function reportFailure(
  promptyId: string,
  serverError: string | null,
  fnErrorMessage: string | null,
): string {
  const detail = serverError ?? fnErrorMessage ?? 'Erro ao gerar imagem'
  // Observability: the credit path is critical — capture generation failures.
  Sentry.captureException(new Error(`generate-image failed: ${detail}`), {
    tags: { feature: 'image-generation' },
    extra: { promptyId, serverError },
  })
  return detail
}

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

    const res = await supabase.functions.invoke<GenerateResponse>('generate-image', {
      body: { prompty_id: promptyId, rendered_prompt: renderedPrompt },
    })
    const data = res.data
    // invoke types `error` loosely (any) — narrow it to read `.message` safely.
    const fnErrorMessage = res.error ? String((res.error as Error).message ?? '') : null

    // Server is the source of truth for credits — refetch on every outcome.
    void useAuthStore.getState().refetchProfile()
    inFlight.current = false

    const url = data?.signed_url
    if (fnErrorMessage || !url) {
      setErrorMsg(reportFailure(promptyId, data?.error ?? null, fnErrorMessage))
      setState('error')
      return
    }
    setSignedUrl(url)
    setState('done')
  }

  return { generate, state, signedUrl, errorMsg, reset: () => setState('idle') }
}
