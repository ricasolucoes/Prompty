import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const useSavedMock = vi.fn()
vi.mock('@/hooks/useSaved', () => ({
  useSaved: () => useSavedMock(),
}))

const { SavedPage } = await import('./SavedPage')

function renderPage() {
  return render(
    <MemoryRouter>
      <SavedPage />
    </MemoryRouter>,
  )
}

function makeItem(prompty_id: string, title: string, slug: string) {
  return {
    prompty_id,
    created_at: '2026-05-01T00:00:00Z',
    title,
    cover_url: null,
    cover_gradient: 'linear-gradient(135deg,#000,#fff)',
    slug,
  }
}

describe('SavedPage', () => {
  beforeEach(() => {
    useSavedMock.mockReset()
  })

  it('CUR-03: renders 3 chips with correct labels', () => {
    useSavedMock.mockReturnValue({ saves: [], ratings: [], results: [], loading: false })
    renderPage()
    expect(screen.getByRole('button', { name: /salvos filtro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /avaliações filtro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resultados filtro/i })).toBeInTheDocument()
  })

  it('default active chip is Salvos', () => {
    useSavedMock.mockReturnValue({ saves: [], ratings: [], results: [], loading: false })
    renderPage()
    expect(screen.getByRole('button', { name: /salvos filtro/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /avaliações filtro/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('renders empty state for Salvos when saves.length === 0', () => {
    useSavedMock.mockReturnValue({ saves: [], ratings: [], results: [], loading: false })
    renderPage()
    expect(screen.getByText('Nenhum prompty salvo ainda')).toBeInTheDocument()
    expect(screen.getByText(/Salve promptys que você gostou/)).toBeInTheDocument()
  })

  it('switching to Avaliações shows correct empty state', () => {
    useSavedMock.mockReturnValue({ saves: [], ratings: [], results: [], loading: false })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /avaliações filtro/i }))
    expect(screen.getByText('Nenhuma avaliação ainda')).toBeInTheDocument()
  })

  it('switching to Resultados shows correct empty state', () => {
    useSavedMock.mockReturnValue({ saves: [], ratings: [], results: [], loading: false })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /resultados filtro/i }))
    expect(screen.getByText('Nenhum resultado enviado ainda')).toBeInTheDocument()
  })

  it('renders SavedCard items in grid for Salvos chip', () => {
    useSavedMock.mockReturnValue({
      saves: [makeItem('p1', 'Saved 1', 'saved-1'), makeItem('p2', 'Saved 2', 'saved-2')],
      ratings: [],
      results: [],
      loading: false,
    })
    renderPage()
    expect(screen.getByRole('link', { name: 'Ver prompty: Saved 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver prompty: Saved 2' })).toBeInTheDocument()
  })
})
