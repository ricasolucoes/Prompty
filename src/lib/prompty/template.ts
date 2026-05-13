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

const VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

/**
 * Extracts unique {{variable}} keys from a template string.
 * Used in WizardStep2Prompt (inline hint) and WizardStep4Advanced (schema editor).
 * Single source of truth — do not duplicate in components.
 */
export function extractVariables(template: string): string[] {
  const keys = new Set<string>()
  for (const match of template.matchAll(VARIABLE_REGEX)) {
    if (match[1]) keys.add(match[1])
  }
  return Array.from(keys)
}
