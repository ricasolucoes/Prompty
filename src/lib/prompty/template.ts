export type InputType = 'text' | 'image' | 'enum' | 'number'

export interface InputField {
  key: string
  label: string
  type: InputType
  required?: boolean
  default?: string | number
  value?: string | number  // prototype data.jsx uses 'value' as default seed
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
}

/**
 * Substitutes {{key}} placeholders with default/value from inputs schema.
 * For L1 — the user never sees the raw template, only the resolved version.
 */
export function resolveBeginner(template: string, inputs: InputField[]): string {
  if (!template) return ''
  if (!Array.isArray(inputs) || inputs.length === 0) return template
  return inputs.reduce<string>((acc, field) => {
    const raw = field.value ?? field.default ?? ''
    const replacement = String(raw)
    return acc.replaceAll(`{{${field.key}}}`, replacement)
  }, template)
}
