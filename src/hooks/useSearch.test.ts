import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Capture chain calls on supabase
const chainCalls = {
  textSearch: vi.fn(),
  eq: vi.fn(),
  contains: vi.fn(),
  or: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  select: vi.fn(),
}
let lastReturn: { data: unknown[]; error: null | Error } = { data: [], error: null }

function makeChain() {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'textSearch', 'contains', 'or']
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      chainCalls[m as keyof typeof chainCalls](...args)
      return chain
    })
  }
  chain.then = (resolve: (value: typeof lastReturn) => void) => resolve(lastReturn)
  return chain
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => makeChain()),
  },
}))

// Import after mock
const { useSearch } = await import('./useSearch')

function renderUseSearch(query: string, category: string | null, model: string | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(() => useSearch(query, category, model), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children),
  })
}

describe('useSearch', () => {
  beforeEach(() => {
    Object.values(chainCalls).forEach((m) => m.mockReset())
    lastReturn = { data: [], error: null }
  })

  it('module is importable and returns expected shape', () => {
    const { result } = renderUseSearch('', null, null)
    expect(result.current).toHaveProperty('pages')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('hasNextPage')
    expect(result.current).toHaveProperty('fetchNextPage')
    expect(Array.isArray(result.current.pages)).toBe(true)
  })

  it('is disabled when query is empty and no filters', async () => {
    renderUseSearch('', null, null)
    // No supabase calls should fire when disabled
    await new Promise((r) => setTimeout(r, 50))
    expect(chainCalls.textSearch).not.toHaveBeenCalled()
  })

  it('FEED-07: calls textSearch on fts column when query is non-empty', async () => {
    renderUseSearch('astronauta', null, null)
    await waitFor(() => expect(chainCalls.textSearch).toHaveBeenCalled())
    expect(chainCalls.textSearch).toHaveBeenCalledWith('fts', 'astronauta', {
      type: 'websearch',
      config: 'simple',
    })
  })

  it('FEED-06: calls .eq("category", value) when category is provided', async () => {
    renderUseSearch('', 'Retrato', null)
    await waitFor(() => expect(chainCalls.eq).toHaveBeenCalled())
    // .eq('status','published') AND .eq('category','Retrato') both fire — assert the second was called
    const calls = chainCalls.eq.mock.calls
    expect(calls.some((c) => c[0] === 'category' && c[1] === 'Retrato')).toBe(true)
  })

  it('FEED-06: calls .contains("models", [value]) when model is provided', async () => {
    renderUseSearch('', null, 'Gemini')
    await waitFor(() => expect(chainCalls.contains).toHaveBeenCalled())
    expect(chainCalls.contains).toHaveBeenCalledWith('models', ['Gemini'])
  })

  it('skips textSearch when query is empty but filter is active', async () => {
    renderUseSearch('', 'Retrato', null)
    await waitFor(() => expect(chainCalls.eq).toHaveBeenCalled())
    expect(chainCalls.textSearch).not.toHaveBeenCalled()
  })

  it('MODR-03: always filters status = published', async () => {
    renderUseSearch('astro', null, null)
    await waitFor(() => expect(chainCalls.eq).toHaveBeenCalled())
    const calls = chainCalls.eq.mock.calls
    expect(calls.some((c) => c[0] === 'status' && c[1] === 'published')).toBe(true)
  })
})
