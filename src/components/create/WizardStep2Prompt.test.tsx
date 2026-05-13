import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardStep2Prompt } from './WizardStep2Prompt'
import type { WizardData } from '@/hooks/useCreatePrompty'

function makeData(beginner_prompt: string): WizardData {
  return {
    title: '',
    beginner_prompt,
    category: 'beginner',
  }
}

describe('WizardStep2Prompt variable detection (CREAT-02)', () => {
  it('shows Detectamos hint when beginner_prompt contains {{var}}', () => {
    render(
      <WizardStep2Prompt
        data={makeData('Hello {{name}}, your order {{order_id}} is ready')}
        onChange={() => {}}
      />
    )
    const hint = screen.getByRole('note', { name: /variáveis detectadas/i })
    expect(hint.textContent).toContain('Detectamos')
    expect(hint.textContent).toContain('{{name}}')
    expect(hint.textContent).toContain('{{order_id}}')
  })

  it('hides hint when prompt has no variables', () => {
    render(
      <WizardStep2Prompt
        data={makeData('A plain prompt with no variables')}
        onChange={() => {}}
      />
    )
    expect(screen.queryByRole('note', { name: /variáveis detectadas/i })).toBeNull()
  })
})
