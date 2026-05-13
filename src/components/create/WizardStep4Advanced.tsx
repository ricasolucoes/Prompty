import { useMemo } from 'react'
import { resolveBeginner, type InputField } from '@/lib/prompty/template'
import { VariableChip } from './VariableChip'
import type { WizardData } from '@/hooks/useCreatePrompty'

const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

export function extractVariables(template: string): string[] {
  const keys = new Set<string>()
  for (const match of template.matchAll(VARIABLE_REGEX)) {
    if (match[1]) keys.add(match[1])
  }
  return Array.from(keys)
}

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function WizardStep4Advanced({ data, onChange }: Props) {
  const advTemplate = data.advancedTemplate ?? ''
  const inputs = data.inputs_schema ?? []

  // Reconcile detected keys with current inputs_schema, preserving label/type/default for keys still present
  const detected = useMemo(() => extractVariables(advTemplate), [advTemplate])

  function handleTemplateChange(value: string) {
    const newKeys = extractVariables(value)
    const existingByKey = Object.fromEntries(inputs.map((f) => [f.key, f]))
    const reconciled: InputField[] = newKeys.map(
      (k) => existingByKey[k] ?? { key: k, label: k, type: 'text' as const },
    )
    onChange({ advancedTemplate: value, inputs_schema: reconciled })
  }

  function handleFieldChange(key: string, patch: Partial<InputField>) {
    const updated = inputs.map((f) => (f.key === key ? { ...f, ...patch } : f))
    onChange({ inputs_schema: updated })
  }

  const previewText = useMemo(
    () => resolveBeginner(advTemplate, inputs),
    [advTemplate, inputs],
  )

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="wizard-advanced-textarea" style={labelStyle()}>
          Template avançado
          <span style={hintStyle()}> · use {'{{variavel}}'} para criar campos</span>
        </label>
        <textarea
          id="wizard-advanced-textarea"
          value={advTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
          rows={8}
          maxLength={4000}
          placeholder="Ex.: Retrato de {{sujeito}} em estilo {{estilo}}"
          aria-label="Template avançado"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: 12,
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--text-1)',
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            minHeight: 160,
          }}
        />
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'var(--text-3)',
            lineHeight: 1.4,
          }}
        >
          Escreva {'{{variavel}}'} para criar campos preenchíveis. A definição dos campos aparece abaixo automaticamente.
        </p>
      </div>

      {detected.length > 0 && (
        <>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-2)',
              letterSpacing: 0.4,
            }}
            aria-live="polite"
          >
            {detected.length} variável(is) detectada(s)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inputs.map((field) => (
              <VariableChip
                key={field.key}
                field={field}
                onChange={(patch) => handleFieldChange(field.key, patch)}
              />
            ))}
          </div>

          {/* Live preview */}
          <div>
            <p style={labelStyle()}>Pré-visualização</p>
            <pre
              data-testid="advanced-preview"
              style={{
                margin: 0,
                marginTop: 4,
                padding: 12,
                borderRadius: 12,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--text-1)',
                fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {previewText}
            </pre>
          </div>
        </>
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

function hintStyle(): React.CSSProperties {
  return {
    fontWeight: 400,
    color: 'var(--text-3)',
    textTransform: 'none',
    letterSpacing: 0,
  }
}
