import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock useCreditHistory before importing the component
const mockUseCreditHistory = vi.fn()
vi.mock('@/hooks/useCreditHistory', () => ({
  useCreditHistory: () => mockUseCreditHistory(),
}))

const { CreditHistorySheet } = await import('./CreditHistorySheet')

const THREE_EVENTS = [
  {
    id: 'e3',
    event_type: 'earned_contribution',
    delta: 1,
    created_at: '2026-05-31T20:00:00Z',
    ref_id: 'r3',
  },
  {
    id: 'e2',
    event_type: 'spent_generation',
    delta: -1,
    created_at: '2026-05-30T10:00:00Z',
    ref_id: 'r2',
  },
  {
    id: 'e1',
    event_type: 'signup_bonus',
    delta: 1,
    created_at: '2026-05-29T08:00:00Z',
    ref_id: null,
  },
]

function renderSheet(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(CreditHistorySheet, { open, onClose: () => {} }),
    ),
  )
}

describe('CreditHistorySheet', () => {
  beforeEach(() => {
    mockUseCreditHistory.mockReset()
  })

  it('renders nothing when open is false', () => {
    mockUseCreditHistory.mockReturnValue({ data: THREE_EVENTS, isLoading: false })
    const { container } = renderSheet(false)
    expect(container.firstChild).toBeNull()
  })

  it('renders all 3 PT-BR event labels when open and data is loaded', () => {
    mockUseCreditHistory.mockReturnValue({ data: THREE_EVENTS, isLoading: false })
    renderSheet()
    expect(screen.getByText('Crédito por contribuição')).toBeInTheDocument()
    expect(screen.getByText('Geração de imagem')).toBeInTheDocument()
    expect(screen.getByText('Bônus de cadastro')).toBeInTheDocument()
  })

  it('renders +1 (green) for positive delta and −1 (coral) for negative delta', () => {
    mockUseCreditHistory.mockReturnValue({ data: THREE_EVENTS, isLoading: false })
    renderSheet()
    // positive delta: +1
    const plusOnes = screen.getAllByText('+1')
    expect(plusOnes.length).toBeGreaterThanOrEqual(1)
    // negative delta: −1 (minus sign is unicode em-like character)
    expect(screen.getByText('−1')).toBeInTheDocument()
  })

  it('renders events in newest-first order (first DOM row is the most recent event)', () => {
    mockUseCreditHistory.mockReturnValue({ data: THREE_EVENTS, isLoading: false })
    renderSheet()
    const labels = screen
      .getAllByText(/Crédito por contribuição|Geração de imagem|Bônus de cadastro/)
      .map((el) => el.textContent)
    expect(labels[0]).toBe('Crédito por contribuição')
    expect(labels[1]).toBe('Geração de imagem')
    expect(labels[2]).toBe('Bônus de cadastro')
  })

  it('shows "Carregando…" when isLoading is true', () => {
    mockUseCreditHistory.mockReturnValue({ data: undefined, isLoading: true })
    renderSheet()
    expect(screen.getByText('Carregando…')).toBeInTheDocument()
  })

  it('shows "Nenhum evento ainda." when events list is empty', () => {
    mockUseCreditHistory.mockReturnValue({ data: [], isLoading: false })
    renderSheet()
    expect(screen.getByText('Nenhum evento ainda.')).toBeInTheDocument()
  })
})
