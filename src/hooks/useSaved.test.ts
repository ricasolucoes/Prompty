import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

type ChainStub = ReturnType<typeof makeChain>
function makeChain(returnValue: { data: unknown[]; error: null }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'not']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: (v: typeof returnValue) => void) => resolve(returnValue)
  return chain as ChainStub
}

const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

const { useSaved } = await import('./useSaved')
const { useAuthStore } = await import('@/stores/auth.store')

describe('useSaved', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    fromMock.mockReset()
  })

  it('returns empty arrays when user is null', async () => {
    const { result } = renderHook(() => useSaved())
    await waitFor(() => {
      expect(result.current.saves).toEqual([])
      expect(result.current.ratings).toEqual([])
      expect(result.current.results).toEqual([])
    })
  })

  it('CUR-03: fires parallel queries on prompty_saves + prompty_tests when user is set', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    fromMock.mockImplementation((table: string) => {
      if (table === 'prompty_saves') return makeChain({ data: [], error: null })
      if (table === 'prompty_tests') return makeChain({ data: [], error: null })
      return makeChain({ data: [], error: null })
    })
    renderHook(() => useSaved())
    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('prompty_saves')
      expect(fromMock).toHaveBeenCalledWith('prompty_tests')
    })
  })

  it('MODR-03: calls .eq(promptys.status, published) on both queries', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })

    const savesChain = makeChain({ data: [], error: null })
    const testsChain = makeChain({ data: [], error: null })

    fromMock.mockImplementation((table: string) => {
      if (table === 'prompty_saves') return savesChain
      if (table === 'prompty_tests') return testsChain
      return makeChain({ data: [], error: null })
    })

    renderHook(() => useSaved())
    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('prompty_saves')
      expect(fromMock).toHaveBeenCalledWith('prompty_tests')
      const savesEq = savesChain.eq as ReturnType<typeof vi.fn>
      const testsEq = testsChain.eq as ReturnType<typeof vi.fn>
      expect(savesEq).toHaveBeenCalledWith('promptys.status', 'published')
      expect(testsEq).toHaveBeenCalledWith('promptys.status', 'published')
    })
  })

  it('CUR-03: results = subset of tests where image_url is non-null', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    const savesData: unknown[] = []
    const testsData = [
      { prompty_id: 'p1', created_at: '2026-05-01T00:00:00Z', image_url: 'https://x/a.webp', rating: 5,
        promptys: { id: 'p1', title: 'Has image', cover_url: null, cover_gradient: 'linear-gradient(135deg,#000,#fff)', slug: 'has-img' } },
      { prompty_id: 'p2', created_at: '2026-05-02T00:00:00Z', image_url: null, rating: 4,
        promptys: { id: 'p2', title: 'No image', cover_url: null, cover_gradient: 'linear-gradient(135deg,#111,#fff)', slug: 'no-img' } },
    ]
    fromMock.mockImplementation((table: string) => {
      if (table === 'prompty_saves') return makeChain({ data: savesData, error: null })
      if (table === 'prompty_tests') return makeChain({ data: testsData, error: null })
      return makeChain({ data: [], error: null })
    })
    const { result } = renderHook(() => useSaved())
    await waitFor(() => {
      expect(result.current.ratings).toHaveLength(2)
      expect(result.current.results).toHaveLength(1)
      expect(result.current.results[0]?.slug).toBe('has-img')
    })
  })
})
