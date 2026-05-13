import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WizardStep1Basics } from './WizardStep1Basics'
import type { WizardData } from '@/hooks/useCreatePrompty'

const fakeData: WizardData = {
  title: '',
  beginner_prompt: '',
  category: 'beginner',
}

describe('WizardStep1Basics', () => {
  it('CREAT-02: renders 3 category chips with labels Simples, Guiado, Avançado', () => {
    render(<WizardStep1Basics data={fakeData} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: 'Simples' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Guiado' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Avançado' })).toBeInTheDocument()
  })

  it('CREAT-02: when data.category=beginner, the Simples chip has aria-checked=true', () => {
    render(<WizardStep1Basics data={fakeData} onChange={vi.fn()} />)
    const simplesChip = screen.getByRole('radio', { name: 'Simples' })
    expect(simplesChip).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Guiado' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Avançado' })).toHaveAttribute('aria-checked', 'false')
  })

  it('CREAT-02: clicking Guiado chip calls onChange with { category: intermediate }', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    render(<WizardStep1Basics data={fakeData} onChange={mockOnChange} />)
    await user.click(screen.getByRole('radio', { name: 'Guiado' }))
    expect(mockOnChange).toHaveBeenCalledWith({ category: 'intermediate' })
  })

  it('CREAT-01: renders title input with label Título and hint text curto e descritivo', () => {
    render(<WizardStep1Basics data={fakeData} onChange={vi.fn()} />)
    expect(screen.getByLabelText('Título do Prompty')).toBeInTheDocument()
    expect(screen.getByText(/curto e descritivo/)).toBeInTheDocument()
  })

  it('CREAT-01: typing Hello in title input calls onChange with { title: Hello }', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    render(<WizardStep1Basics data={fakeData} onChange={mockOnChange} />)
    const titleInput = screen.getByLabelText('Título do Prompty')
    await user.type(titleInput, 'H')
    expect(mockOnChange).toHaveBeenCalledWith({ title: 'H' })
  })

  it('CREAT-01: Modelo recomendado field is hidden by default; clicking disclosure shows it', async () => {
    const user = userEvent.setup()
    render(<WizardStep1Basics data={fakeData} onChange={vi.fn()} />)
    // Hidden by default
    expect(screen.queryByLabelText('Modelo recomendado')).not.toBeInTheDocument()
    // Click disclosure
    await user.click(screen.getByRole('button', { name: /Mais opções/i }))
    // Now visible
    expect(screen.getByLabelText('Modelo recomendado')).toBeInTheDocument()
  })
})
