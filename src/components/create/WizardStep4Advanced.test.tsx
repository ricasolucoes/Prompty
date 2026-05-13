import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { WizardStep4Advanced } from './WizardStep4Advanced'
import type { WizardData } from '@/hooks/useCreatePrompty'

const fakeData: WizardData = {
  title: 'X',
  beginner_prompt: 'Y',
  category: 'beginner',
  advancedTemplate: '',
  inputs_schema: [],
}

function StatefulWrapper({ initial = fakeData }: { initial?: WizardData }) {
  const [state, setState] = useState<WizardData>(initial)
  return (
    <WizardStep4Advanced
      data={state}
      onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
    />
  )
}

function changeTemplate(value: string) {
  const textarea = screen.getByRole('textbox', { name: 'Template avançado' })
  fireEvent.change(textarea, { target: { value } })
}

describe('WizardStep4Advanced', () => {
  it('CREAT-05: typing template with {{name}} detects one VariableChip with key name', () => {
    render(<StatefulWrapper />)
    changeTemplate('Hello {{name}}')
    expect(screen.getByText('{{name}}')).toBeInTheDocument()
  })

  it('CREAT-05: duplicate keys {{a}} {{a}} deduplicate to one chip', () => {
    render(<StatefulWrapper />)
    changeTemplate('Hello {{a}} world {{a}}')
    const chips = screen.getAllByText('{{a}}')
    expect(chips).toHaveLength(1)
  })

  it('CREAT-05: {{a}} {{b}} renders 2 VariableChips', () => {
    render(<StatefulWrapper />)
    changeTemplate('Hello {{a}} world {{b}}')
    expect(screen.getByText('{{a}}')).toBeInTheDocument()
    expect(screen.getByText('{{b}}')).toBeInTheDocument()
  })

  it('CREAT-05: live preview shows resolveBeginner output when chip default is set', () => {
    const initial: WizardData = {
      ...fakeData,
      advancedTemplate: 'Olá {{name}}',
      inputs_schema: [{ key: 'name', label: 'name', type: 'text', default: 'Maria' }],
    }
    render(<StatefulWrapper initial={initial} />)
    const preview = screen.getByTestId('advanced-preview')
    expect(preview.textContent).toBe('Olá Maria')
  })

  it('CREAT-05: when no variables detected, counter and preview are hidden', () => {
    render(<StatefulWrapper initial={{ ...fakeData, advancedTemplate: 'No variables here' }} />)
    expect(screen.queryByTestId('advanced-preview')).not.toBeInTheDocument()
    expect(screen.queryByText(/variável\(is\) detectada\(s\)/)).not.toBeInTheDocument()
  })

  it('CREAT-05: counter shows "N variável(is) detectada(s)" when N > 0', () => {
    render(<StatefulWrapper />)
    changeTemplate('{{x}} {{y}} {{z}}')
    expect(screen.getByText(/3 variável\(is\) detectada\(s\)/)).toBeInTheDocument()
  })
})
