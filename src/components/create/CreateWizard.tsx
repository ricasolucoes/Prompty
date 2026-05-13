import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Toast } from '@/components/ui/Toast'
import { WizardProgressBar } from './WizardProgressBar'
import { WizardStep1Basics } from './WizardStep1Basics'
import { WizardStep2Prompt } from './WizardStep2Prompt'
import { WizardStep3Image } from './WizardStep3Image'
import { WizardStep4Advanced } from './WizardStep4Advanced'
import type { WizardData } from '@/hooks/useCreatePrompty'
import type { InputField } from '@/lib/prompty/template'

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

  async function handlePublish(overrides?: Partial<WizardData>) {
    setPublishing(true)
    setError(null)
    const payload = overrides ? { ...data, ...overrides } : data
    const r = await onPublish(payload)
    setPublishing(false)
    if (!r.ok) {
      setError(r.error ?? 'Não foi possível publicar. Verifique sua conexão e tente novamente.')
    }
    // success — caller is responsible for navigation; the Promise has already resolved into onPublish
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
        {step === 2 && <WizardStep3Image data={data} onChange={patch} />}
        {step === 3 && <WizardStep4Advanced data={data} onChange={patch} />}
      </section>

      {/* Footer CTAs */}
      <div style={{ padding: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {step === 0 && (
          <PrimaryButton full disabled={!isStepValid(step) || publishing} onClick={next}>
            Continuar
          </PrimaryButton>
        )}
        {step === 1 && (
          <PrimaryButton full disabled={!isStepValid(step) || publishing} onClick={next}>
            Continuar
          </PrimaryButton>
        )}
        {step === 2 && (
          <>
            <PrimaryButton full disabled={publishing} onClick={() => { void handlePublish() }}>
              Publicar Prompty
            </PrimaryButton>
            <button
              type="button"
              onClick={next}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5,
                fontWeight: 700, cursor: 'pointer', padding: 8,
              }}
            >
              Continuar para modo avançado
            </button>
            <button
              type="button"
              onClick={() => { patch({ coverFile: undefined as unknown as File }); void handlePublish({ coverFile: undefined as unknown as File }) }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-3)',
                fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5,
                fontWeight: 700, cursor: 'pointer', padding: 8,
              }}
            >
              Pular imagem
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <PrimaryButton full disabled={publishing} onClick={() => { void handlePublish() }}>
              Salvar modo avançado e publicar
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                const skipAdv = { advancedTemplate: undefined as unknown as string, inputs_schema: [] as InputField[] }
                patch(skipAdv)
                void handlePublish(skipAdv)
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontFamily: 'var(--font-sans, sans-serif)', fontSize: 13.5,
                fontWeight: 700, cursor: 'pointer', padding: 8,
              }}
            >
              Ignorar e publicar
            </button>
          </>
        )}
      </div>

      {error && <Toast message={error} icon="x" iconColor="#FF3B6B" onDismiss={() => setError(null)} />}
    </div>
  )
}
