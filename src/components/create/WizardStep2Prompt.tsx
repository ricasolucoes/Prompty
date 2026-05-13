import type { WizardData } from '@/hooks/useCreatePrompty'

interface Props {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function WizardStep2Prompt({ data, onChange }: Props) {
  const charCount = data.beginner_prompt.length

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle()} htmlFor="wizard-prompt-textarea">
          Prompt beginner
          <span style={hintStyle()}> · texto pronto para copiar e colar</span>
        </label>
        <textarea
          id="wizard-prompt-textarea"
          value={data.beginner_prompt}
          onChange={(e) => onChange({ beginner_prompt: e.target.value })}
          rows={10}
          maxLength={4000}
          placeholder="Cole o prompt completo aqui. Ex.: A cinematic portrait of an astronaut..."
          aria-label="Prompt beginner"
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
            resize: 'vertical',
            minHeight: 200,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 4,
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: 11,
            color: 'var(--text-3)',
          }}
        >
          {charCount} chars
        </div>
      </div>

      {/* Tip callout */}
      <aside
        role="note"
        style={{
          padding: 12,
          borderRadius: 12,
          background: 'rgba(34,211,238,0.08)',
          border: '1px solid rgba(34,211,238,0.25)',
          color: 'var(--text-2)',
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        Teste o prompt em pelo menos 2 modelos antes de publicar. Promptys que funcionam em vários modelos sobem mais rápido.
      </aside>
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
