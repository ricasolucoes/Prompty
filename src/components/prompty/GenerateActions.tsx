import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { GeneratedImageModal } from '@/components/prompty/GeneratedImageModal'
import type { GenState } from '@/hooks/useGenerate'

interface GenerateActionsProps {
  readonly isAnon: boolean
  readonly credits: number
  readonly genState: GenState
  readonly signedUrl: string | null
  readonly errorMsg: string | null
  readonly onSignup: () => void
  readonly onGenerate: () => void
  readonly onCloseModal: () => void
}

const ANON_BTN_CLASS =
  'inline-flex w-full items-center justify-center rounded-[14px] px-4 py-3 font-bold'

/** Image-generation UI: anon CTA / zero-credit nudge / generate button / result modal / error. */
export function GenerateActions({
  isAnon,
  credits,
  genState,
  signedUrl,
  errorMsg,
  onSignup,
  onGenerate,
  onCloseModal,
}: GenerateActionsProps) {
  return (
    <>
      {/* GEN-06: Anonymous user — signup CTA */}
      {isAnon && (
        <button
          type="button"
          onClick={onSignup}
          className={ANON_BTN_CLASS}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 13.5,
            lineHeight: 1.2,
            cursor: 'pointer',
          }}
        >
          Cadastre-se e ganhe 1 crédito para gerar
        </button>
      )}

      {/* GEN-07: Logged-in, zero credits — earn nudge (never a paywall) */}
      {!isAnon && credits === 0 && (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-2)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Sem créditos. Contribua para ganhar mais: publique um prompty (+1), envie um resultado
          aprovado (+1) ou suba de nível (+2).
        </p>
      )}

      {/* GEN-01/03/05: Logged-in, has credits — generate button */}
      {!isAnon && credits >= 1 && (
        <PrimaryButton full disabled={genState === 'loading'} icon="wand" onClick={onGenerate}>
          {genState === 'loading' ? 'Gerando imagem (~10s)…' : 'Gerar imagem (1 crédito)'}
        </PrimaryButton>
      )}

      {/* GEN-05: Success — image in modal/lightbox overlay */}
      {genState === 'done' && signedUrl && (
        <GeneratedImageModal signedUrl={signedUrl} onClose={onCloseModal} />
      )}

      {/* GEN-04/05: Error — message + refund notice */}
      {genState === 'error' && (
        <p style={{ color: '#FF3B6B', fontSize: 13, marginTop: 8 }}>
          {errorMsg} Seu crédito foi devolvido.
        </p>
      )}
    </>
  )
}
