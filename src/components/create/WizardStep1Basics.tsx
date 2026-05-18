import { useState } from 'react'
import type { WizardData } from '@/hooks/useCreatePrompty'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

const CATEGORY_OPTIONS: { value: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { value: 'beginner', label: 'Simples' },
  { value: 'intermediate', label: 'Guiado' },
  { value: 'advanced', label: 'Avançado' },
]

// eslint-disable-next-line max-lines-per-function -- step component with form fields; refactor deferred
export function WizardStep1Basics({ data, onChange }: Readonly<Props>) {
  const [showOptional, setShowOptional] = useState(false)

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title field */}
      <label style={labelStyle()}>
        Título
        <span style={hintStyle()}> · curto e descritivo</span>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={80}
          placeholder="Ex.: Retrato cinematográfico"
          style={inputStyle()}
          aria-label="Título do Prompty"
        />
      </label>

      {/* Category / complexity chips */}
      <div>
        <p style={labelHeaderStyle()}>Complexidade</p>
        <div role="radiogroup" aria-label="Complexidade" style={{ display: 'flex', gap: 8 }}>
          {CATEGORY_OPTIONS.map((opt) => {
            const isSelected = data.category === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                role="radio"
                aria-checked={isSelected}
                aria-label={opt.label}
                onClick={() => onChange({ category: opt.value })}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--line)'}`,
                  background: isSelected ? 'rgba(124,58,237,0.10)' : 'var(--surface)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-2)',
                  fontFamily: 'var(--font-sans, sans-serif)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Optional fields disclosure */}
      <button
        type="button"
        onClick={() => setShowOptional((v) => !v)}
        aria-expanded={showOptional}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {showOptional ? 'Ocultar opções' : 'Mais opções (tags, modelo)'}
      </button>

      {showOptional && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={labelStyle()}>
            Tags
            <span style={hintStyle()}> · separadas por vírgula</span>
            <input
              type="text"
              value={(data.styleTags ?? []).join(', ')}
              onChange={(e) =>
                onChange({
                  styleTags: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Ex.: cinematográfico, retrato, dramático"
              style={inputStyle()}
              aria-label="Tags"
            />
          </label>
          <label style={labelStyle()}>
            Modelo recomendado
            <span style={hintStyle()}> · opcional</span>
            <input
              type="text"
              value={data.recommendedModel ?? ''}
              onChange={(e) => onChange({ recommendedModel: e.target.value })}
              placeholder="Ex.: gemini-2.5-flash"
              style={inputStyle()}
              aria-label="Modelo recomendado"
            />
          </label>
        </div>
      )}
    </div>
  )
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'var(--text-3)',
  }
}
function labelHeaderStyle(): React.CSSProperties {
  return {
    margin: 0,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'var(--text-3)',
  }
}
function hintStyle(): React.CSSProperties {
  return {
    fontWeight: 400,
    color: 'var(--text-3)',
    textTransform: 'none',
    letterSpacing: 0,
  }
}
function inputStyle(): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '12px',
    borderRadius: 12,
    border: '1px solid var(--line)',
    background: 'var(--surface-2)',
    color: 'var(--text-1)',
    fontSize: 14,
    fontFamily: 'var(--font-sans, sans-serif)',
  }
}
