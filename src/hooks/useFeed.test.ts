import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const chainCalls = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  or: vi.fn(),
}
let lastReturn: { data: unknown[]; error: null } = { data: [], error: null }

function makeChain() {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'or']
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      ;(chainCalls[m as keyof typeof chainCalls] as (...a: unknown[]) => void)(...args)
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

const { useFeed } = await import('./useFeed')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useFeed', () => {
  beforeEach(() => {
    Object.values(chainCalls).forEach((m) => m.mockReset())
    lastReturn = { data: [], error: null }
  })

  it('FEED-05: uses cursor-based query (NOT range/offset)', async () => {
    renderHook(() => useFeed(), { wrapper })
    await waitFor(() => expect(chainCalls.order).toHaveBeenCalled())
    expect(chainCalls.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(chainCalls.order).toHaveBeenCalledWith('id', { ascending: false })
    expect(chainCalls.limit).toHaveBeenCalledWith(10)
  })

  it('MODR-03: filters .eq("status", "published") on every feed query', async () => {
    renderHook(() => useFeed(), { wrapper })
    await waitFor(() => expect(chainCalls.eq).toHaveBeenCalled())
    const calls = chainCalls.eq.mock.calls
    expect(calls.some((c) => c[0] === 'status' && c[1] === 'published')).toBe(true)
  })

  it('joins profiles for author info via the author_id FK (disambiguated embed)', async () => {
    renderHook(() => useFeed(), { wrapper })
    await waitFor(() => expect(chainCalls.select).toHaveBeenCalled())
    const selectArg = chainCalls.select.mock.calls[0]?.[0] as string
    // Must name the FK: promptys relates to profiles via author_id, likes and saves —
    // an unqualified `profiles(...)` embed is ambiguous (PGRST201) and breaks the feed.
    expect(selectArg).toContain('profiles!promptys_author_id_fkey(name, username, avatar_url)')
  })
})
