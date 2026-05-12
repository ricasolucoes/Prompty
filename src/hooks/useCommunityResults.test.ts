import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const chainCalls = {
  select: vi.fn(),
  eq: vi.fn(),
  not: vi.fn(),
  order: vi.fn(),
}
let lastReturn: { data: unknown[]; error: null } = { data: [], error: null }

function makeChain() {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'not', 'order']
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      chainCalls[m as keyof typeof chainCalls](...args)
      return chain
    })
  }
  chain.then = (resolve: (v: typeof lastReturn) => void) => resolve(lastReturn)
  return chain
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => makeChain()),
  },
}))

const { useCommunityResults } = await import('./useCommunityResults')

describe('useCommunityResults', () => {
  beforeEach(() => {
    Object.values(chainCalls).forEach((m) => m.mockReset())
    lastReturn = { data: [], error: null }
  })

  it('returns empty array when promptyId is null', async () => {
    const { result } = renderHook(() => useCommunityResults(null))
    await waitFor(() => expect(result.current.results).toEqual([]))
    expect(chainCalls.eq).not.toHaveBeenCalled()
  })

  it('CUR-01 surface: queries prompty_tests with image_url filter for given promptyId', async () => {
    renderHook(() => useCommunityResults('p1'))
    await waitFor(() => expect(chainCalls.eq).toHaveBeenCalled())
    expect(chainCalls.eq).toHaveBeenCalledWith('prompty_id', 'p1')
    expect(chainCalls.not).toHaveBeenCalledWith('image_url', 'is', null)
    expect(chainCalls.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('joins profiles for contributor info', async () => {
    renderHook(() => useCommunityResults('p1'))
    await waitFor(() => expect(chainCalls.select).toHaveBeenCalled())
    const arg = chainCalls.select.mock.calls[0]?.[0] as string
    expect(arg).toContain('profiles(id, name, avatar_url)')
  })

  it('maps raw rows to CommunityResult shape', async () => {
    lastReturn = {
      data: [
        {
          id: 't1',
          image_url: 'https://x/a.webp',
          rating: 5,
          notes: 'nice',
          created_at: '2026-05-01T00:00:00Z',
          user_id: 'u1',
          profiles: { id: 'u1', name: 'Alice', avatar_url: null },
        },
      ],
      error: null,
    }
    const { result } = renderHook(() => useCommunityResults('p1'))
    await waitFor(() => expect(result.current.results).toHaveLength(1))
    expect(result.current.results[0]).toMatchObject({
      id: 't1',
      image_url: 'https://x/a.webp',
      rating: 5,
      notes: 'nice',
      user: { id: 'u1', name: 'Alice' },
    })
  })
})
