import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const useCommunityResultsMock = vi.fn()
vi.mock('@/hooks/useCommunityResults', () => ({
  useCommunityResults: (...args: unknown[]) => useCommunityResultsMock(...args),
}))

const { CommunityResults } = await import('./CommunityResults')

function fakeResult(
  overrides: Partial<{
    id: string
    image_url: string
    name: string | null
    rating: number | null
    notes: string | null
  }> = {},
) {
  return {
    id: overrides.id ?? 't1',
    image_url: overrides.image_url ?? 'https://x/a.webp',
    rating: overrides.rating ?? 5,
    notes: overrides.notes ?? null,
    created_at: '2026-05-01T00:00:00Z',
    user: { id: 'u1', name: overrides.name ?? 'Alice', avatar_url: null },
  }
}

describe('CommunityResults', () => {
  beforeEach(() => {
    useCommunityResultsMock.mockReset()
  })

  it('renders nothing when results is empty (absent, not empty state)', () => {
    useCommunityResultsMock.mockReturnValue({ results: [], loading: false })
    const { container } = render(<CommunityResults promptyId="p1" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section label + count badge when results > 0', () => {
    useCommunityResultsMock.mockReturnValue({
      results: [fakeResult({ id: 't1' }), fakeResult({ id: 't2', name: 'Bob' })],
      loading: false,
    })
    render(<CommunityResults promptyId="p1" />)
    expect(screen.getByText('RESULTADOS DA COMUNIDADE')).toBeInTheDocument()
    expect(screen.getByLabelText('2 resultados')).toBeInTheDocument()
  })

  it('renders one button per result with aria-label "Ver resultado de {name}"', () => {
    useCommunityResultsMock.mockReturnValue({
      results: [fakeResult({ id: 't1', name: 'Alice' }), fakeResult({ id: 't2', name: 'Bob' })],
      loading: false,
    })
    render(<CommunityResults promptyId="p1" />)
    expect(screen.getByRole('button', { name: 'Ver resultado de Alice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver resultado de Bob' })).toBeInTheDocument()
  })

  it('clicking a tile opens FullImageModal with that result', () => {
    useCommunityResultsMock.mockReturnValue({
      results: [fakeResult({ id: 't1', name: 'Alice' })],
      loading: false,
    })
    render(<CommunityResults promptyId="p1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado de Alice' }))
    // FullImageModal opens with aria-label "Resultado enviado por Alice"
    expect(screen.getByRole('dialog', { name: 'Resultado enviado por Alice' })).toBeInTheDocument()
  })

  it('FullImageModal closes on close button click', () => {
    useCommunityResultsMock.mockReturnValue({
      results: [fakeResult({ id: 't1', name: 'Alice' })],
      loading: false,
    })
    render(<CommunityResults promptyId="p1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado de Alice' }))
    expect(
      screen.queryByRole('dialog', { name: 'Resultado enviado por Alice' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Fechar imagem'))
    expect(
      screen.queryByRole('dialog', { name: 'Resultado enviado por Alice' }),
    ).not.toBeInTheDocument()
  })

  it('FullImageModal closes on backdrop click', () => {
    useCommunityResultsMock.mockReturnValue({
      results: [fakeResult({ id: 't1', name: 'Alice' })],
      loading: false,
    })
    render(<CommunityResults promptyId="p1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado de Alice' }))
    const dialog = screen.getByRole('dialog', { name: 'Resultado enviado por Alice' })
    fireEvent.click(dialog)
    expect(
      screen.queryByRole('dialog', { name: 'Resultado enviado por Alice' }),
    ).not.toBeInTheDocument()
  })
})
