import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Toast } from '@/components/ui/Toast'
import { WizardProgressBar } from './WizardProgressBar'
import { WizardStep1Basics } from './WizardStep1Basics'
import { WizardStep2Prompt } from './WizardStep2Prompt'
import type { WizardData } from '@/hooks/useCreatePrompty'

const TOTAL_STEPS = 4

export interface CreateWizardProps {
  initialData?: Partial<WizardData>
  onClose: () => void
  onPublish: (data: WizardData) => Promise<{ ok: boolean; error?: string; slug?: string }>
}

const DEFAULT_DATA: WizardData = {
  title: '',
  beginner_prompt: '',
  category: 'beginner',
}

export function CreateWizard({ initialData, onClose, onPublish }: CreateWizardProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({ ...DEFAULT_DATA, ...initialData })
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(p: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...p }))
  }

  function back() {
    if (step === 0) {
      onClose()
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }

  function isStepValid(s: number): boolean {
    if (s === 0) return data.title.trim().length > 0 && !!data.category
    if (s === 1) return data.beginner_prompt.trim().length > 0
    return true  // steps 2 (image) and 3 (advanced) have no mandatory fields
  }

  async function handlePublish() {
    setPublishing(true)
    setError(null)
    const r = await onPublish(data)
    setPublishing(false)
    if (!r.ok) {
      setError(r.error ?? 'Não foi possível publicar. Verifique sua conexão e tente novamente.')
    }
    // success redirect handled by CriarPage via onPublish's resolved value
  }

  // Header title per step
  const headerTitle = step === 3 ? 'Modo avançado (opcional)' : 'Criar Prompty'

  return (
    <div className="screen" style={{ paddingBottom: 96, maxWidth: 430, margin: '0 auto', minHeight: '100vh' }}>
      {/* Header: back chevron + title */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '24px 16px 16px',
        }}
      >
        <button
          type="button"
          onClick={back}
          aria-label="Voltar"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text-2)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Icon name="chevronL" size={20} />
        </button>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display, sans-serif)',
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: -0.4,
            lineHeight: 1.25,
            color: 'var(--text-1)',
          }}
        >
          {headerTitle}
        </h1>
      </header>

      <WizardProgressBar step={step} totalSteps={TOTAL_STEPS} />

      {/* Step body */}
      <section style={{ marginTop: 8 }}>
        {step === 0 && <WizardStep1Basics data={data} onChange={patch} />}
        {step === 1 && <WizardStep2Prompt data={data} onChange={patch} />}
        {/* steps 2 (image) and 3 (advanced) wired in Plan 03-05 */}
      </section>

      {/* Footer CTA — Continuar for non-final steps; Plan 03-05 will add publish CTA on steps 2+3 */}
      <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {step < TOTAL_STEPS - 1 && (
          <PrimaryButton
            full
            disabled={!isStepValid(step) || publishing}
            onClick={next}
          >
            Continuar
          </PrimaryButton>
        )}
      </div>

      {error && <Toast message={error} icon="x" iconColor="#FF3B6B" onDismiss={() => setError(null)} />}

      {/* handlePublish wired by Plan 03-05 when adding publish button on steps 2+3 */}
      {false && <button onClick={handlePublish} />}
    </div>
  )
}
