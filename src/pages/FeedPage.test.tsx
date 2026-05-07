import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

// Mock useFeed before importing FeedPage
const useFeedMock = vi.fn()
vi.mock('@/hooks/useFeed', () => ({
  useFeed: () => useFeedMock(),
}))

const { FeedPage } = await import('./FeedPage')
const { useAuthStore } = await import('@/stores/auth.store')

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FeedPage', () => {
  beforeEach(() => {
    useFeedMock.mockReset()
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('renders WelcomeStrip for unauthenticated visitor (AUTH-05 + FEED-02)', () => {
    useFeedMock.mockReturnValue({
      pages: [], isLoading: false, isFetchingNextPage: false, hasNextPage: false,
      fetchNextPage: () => {}, refetch: () => {},
    })
    renderPage()
    expect(screen.getByLabelText('Como funciona')).toBeInTheDocument()
  })

  it('does NOT render WelcomeStrip for authenticated user', () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    useFeedMock.mockReturnValue({
      pages: [], isLoading: false, isFetchingNextPage: false, hasNextPage: false,
      fetchNextPage: () => {}, refetch: () => {},
    })
    renderPage()
    expect(screen.queryByLabelText('Como funciona')).not.toBeInTheDocument()
  })

  it('renders skeleton cards while loading', () => {
    useFeedMock.mockReturnValue({
      pages: [], isLoading: true, isFetchingNextPage: false, hasNextPage: false,
      fetchNextPage: () => {}, refetch: () => {},
    })
    const { container } = renderPage()
    // SkeletonCard uses aria-hidden; count via article elements
    expect(container.querySelectorAll('article[aria-hidden="true"]').length).toBeGreaterThanOrEqual(2)
  })

  it('renders empty-state copy when no items and not loading', () => {
    useFeedMock.mockReturnValue({
      pages: [[]], isLoading: false, isFetchingNextPage: false, hasNextPage: false,
      fetchNextPage: () => {}, refetch: () => {},
    })
    renderPage()
    expect(screen.getByText(/Nada por aqui ainda/)).toBeInTheDocument()
  })
})
