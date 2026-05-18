import { describe, it, expect } from 'vitest'
import { resolveBeginner, type InputField } from './template'

describe('resolveBeginner', () => {
  it('substitutes a single {{key}} with default', () => {
    const out = resolveBeginner('Hello {{name}}', [
      { key: 'name', label: 'Name', type: 'text', default: 'World' },
    ])
    expect(out).toBe('Hello World')
  })
  it('substitutes using value when default is absent (prototype compat)', () => {
    const out = resolveBeginner('Hi {{name}}', [
      { key: 'name', label: 'Name', type: 'text', value: 'Mira' },
    ])
    expect(out).toBe('Hi Mira')
  })
  it('returns template unchanged for empty inputs array', () => {
    expect(resolveBeginner('Hello {{name}}', [])).toBe('Hello {{name}}')
  })
  it('replaces multiple occurrences of same {{key}}', () => {
    const out = resolveBeginner('{{x}} and {{x}}', [
      { key: 'x', label: 'X', type: 'text', default: 'A' },
    ])
    expect(out).toBe('A and A')
  })
  it('coerces numeric value to string', () => {
    const out = resolveBeginner('chaos={{n}}', [
      { key: 'n', label: 'N', type: 'number', value: 20 },
    ])
    expect(out).toBe('chaos=20')
  })
  it('substitutes empty string when neither value nor default present', () => {
    const out = resolveBeginner('img: {{ref}}', [{ key: 'ref', label: 'Ref', type: 'image' }])
    expect(out).toBe('img: ')
  })
  it('leaves unknown {{key}} placeholders intact', () => {
    const out = resolveBeginner('{{a}} and {{unknown}}', [
      { key: 'a', label: 'A', type: 'text', default: 'X' },
    ])
    expect(out).toBe('X and {{unknown}}')
  })
  it('returns empty string for empty template', () => {
    expect(resolveBeginner('', [])).toBe('')
  })
  it('handles real prototype Retrato Cinematográfico fields', () => {
    const inputs: InputField[] = [
      { key: 'subject_description', label: 'Personagem', type: 'text', value: 'uma astrônoma' },
      { key: 'environment', label: 'Ambiente', type: 'text', value: 'um observatório' },
    ]
    const out = resolveBeginner(
      'Create portrait of {{subject_description}} in {{environment}}.',
      inputs,
    )
    expect(out).toBe('Create portrait of uma astrônoma in um observatório.')
  })
})
