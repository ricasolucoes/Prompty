import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

const useSearchMock = vi.fn()
vi.mock('@/hooks/useSearch', () => ({
  useSearch: (...args: unknown[]) => useSearchMock(...args),
}))

const { SearchPage } = await import('./SearchPage')

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(MemoryRouter, null, React.createElement(SearchPage)),
    ),
  )
}

function mockResult(
  overrides: Partial<{ pages: unknown[][]; isLoading: boolean; enabled: boolean }> = {},
) {
  useSearchMock.mockReturnValue({
    pages: [],
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    enabled: false,
    ...overrides,
  })
}

describe('SearchPage', () => {
  beforeEach(() => {
    useSearchMock.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders idle empty state when no query and no filters', () => {
    mockResult({ enabled: false })
    renderPage()
    expect(screen.getByText('Buscar Promptys')).toBeInTheDocument()
    expect(screen.getByText(/Digite uma palavra-chave/)).toBeInTheDocument()
  })

  it('FEED-07: typing debounces 300ms before useSearch sees the value', () => {
    mockResult({ enabled: false })
    renderPage()
    const input = screen.getByRole('searchbox', { name: /buscar promptys/i })
    fireEvent.change(input, { target: { value: 'astro' } })
    // Immediately useSearch is still called with empty string (debounced)
    expect(useSearchMock).toHaveBeenLastCalledWith('', null, null)
    act(() => {
      vi.advanceTimersByTime(300)
    })
    // After 300ms the debouncedQuery updates and useSearch is called with 'astro'
    expect(useSearchMock).toHaveBeenCalledWith('astro', null, null)
  })

  it('clear button appears only when query is non-empty and resets immediately', () => {
    mockResult({ enabled: false })
    renderPage()
    const input = screen.getByRole('searchbox', { name: /buscar promptys/i })
    expect(screen.queryByLabelText('Limpar busca')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'x' } })
    expect(screen.getByLabelText('Limpar busca')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Limpar busca'))
    expect(useSearchMock).toHaveBeenLastCalledWith('', null, null)
  })

  it('FEED-06: tapping category chip calls useSearch with category set', () => {
    mockResult({ enabled: false })
    renderPage()
    const chip = screen.getByRole('button', { name: /retrato filtro/i })
    fireEvent.click(chip)
    expect(useSearchMock).toHaveBeenCalledWith('', 'Retrato', null)
  })

  it('FEED-06: tapping model chip calls useSearch with model set', () => {
    mockResult({ enabled: false })
    renderPage()
    const chip = screen.getByRole('button', { name: /gemini filtro/i })
    fireEvent.click(chip)
    expect(useSearchMock).toHaveBeenCalledWith('', null, 'Gemini')
  })

  it('renders "Nenhum resultado" empty state when enabled + 0 results', () => {
    mockResult({ enabled: true, pages: [[]] })
    renderPage()
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument()
  })

  it('renders 2 SkeletonCards during initial load', () => {
    mockResult({ enabled: true, isLoading: true })
    const { container } = renderPage()
    expect(container.querySelectorAll('article[aria-hidden="true"]').length).toBeGreaterThanOrEqual(
      2,
    )
  })
})
