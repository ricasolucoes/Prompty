import type { InputField, InputType } from '@/lib/prompty/template'

interface Props {
  field: InputField
  onChange: (patch: Partial<InputField>) => void
}

const TYPE_OPTIONS: { value: InputType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'enum', label: 'Lista' },
  { value: 'number', label: 'Número' },
]

export function VariableChip({ field, onChange }: Props) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
            fontSize: 13.5,
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          {`{{${field.key}}}`}
        </code>
      </div>

      <input
        type="text"
        value={field.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Nome amigável"
        aria-label={`Label para ${field.key}`}
        style={inputStyle()}
      />

      <select
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as InputType })}
        aria-label={`Tipo para ${field.key}`}
        style={inputStyle()}
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={(field.default as string | undefined) ?? ''}
        onChange={(e) => onChange({ default: e.target.value })}
        placeholder="Valor padrão"
        aria-label={`Valor padrão para ${field.key}`}
        style={inputStyle()}
      />
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    fontSize: 14,
    fontFamily: 'var(--font-sans, sans-serif)',
  }
}
