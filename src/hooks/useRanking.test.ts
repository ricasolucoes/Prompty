import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

type Resolved = { data?: unknown[]; count?: number; error: null }
function makeChain(resolved: Resolved) {
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'gt', 'order', 'limit']) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: (v: Resolved) => void) => resolve(resolved)
  return chain as Record<string, ReturnType<typeof vi.fn>>
}

const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

const { useRanking } = await import('./useRanking')
const { useAuthStore } = await import('@/stores/auth.store')

const TOP = [
  {
    id: 'u1',
    username: 'ana',
    name: 'Ana',
    avatar_url: null,
    level: 'L4',
    points: 1200,
    verified: true,
  },
  {
    id: 'u2',
    username: 'bob',
    name: 'Bob',
    avatar_url: null,
    level: 'L3',
    points: 600,
    verified: false,
  },
  {
    id: 'u3',
    username: null,
    name: 'Cris',
    avatar_url: null,
    level: 'L3',
    points: 300,
    verified: false,
  },
]

describe('useRanking', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    fromMock.mockReset()
  })

  it('returns the top profiles ordered by points (and stops loading)', async () => {
    fromMock.mockReturnValue(makeChain({ data: TOP, error: null }))
    const { result } = renderHook(() => useRanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toEqual(TOP)
    expect(result.current.myRank).toBeNull() // no logged-in user
  })

  it('GAME2-01: queries profiles with points > 0 and never selects is_admin', async () => {
    const chain = makeChain({ data: TOP, error: null })
    fromMock.mockReturnValue(chain)
    renderHook(() => useRanking())
    await waitFor(() => expect(fromMock).toHaveBeenCalledWith('profiles'))
    expect(chain.gt).toHaveBeenCalledWith('points', 0)
    const cols = chain.select.mock.calls[0]?.[0] as string
    expect(cols).not.toMatch(/is_admin/)
    expect(chain.select).toHaveBeenCalledWith(expect.stringContaining('points'))
  })

  it('derives myRank from the visible list when the user is in the top', async () => {
    useAuthStore.setState({
      user: { id: 'u2' } as never,
      profile: { points: 600 } as never,
      loading: false,
    })
    fromMock.mockReturnValue(makeChain({ data: TOP, error: null }))
    const { result } = renderHook(() => useRanking())
    await waitFor(() => expect(result.current.myRank).toBe(2))
    // Only the top-list query runs; no extra count query needed
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('counts outranking profiles to resolve myRank when the user is outside the top', async () => {
    useAuthStore.setState({
      user: { id: 'zz' } as never,
      profile: { points: 30 } as never,
      loading: false,
    })
    const topChain = makeChain({ data: TOP, error: null })
    const countChain = makeChain({ count: 4, error: null })
    fromMock.mockReturnValueOnce(topChain).mockReturnValueOnce(countChain)
    const { result } = renderHook(() => useRanking())
    await waitFor(() => expect(result.current.myRank).toBe(5)) // 4 ahead + 1
    expect(countChain.gt).toHaveBeenCalledWith('points', 30)
  })

  it('returns an empty list when no profiles have points yet', async () => {
    fromMock.mockReturnValue(makeChain({ data: [], error: null }))
    const { result } = renderHook(() => useRanking())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toEqual([])
  })
})
