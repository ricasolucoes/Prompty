import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// --- Mock setup ---

const fromMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector(authStoreSpy()),
}))

// Mutable spy so individual tests can override
let authStoreSpy = vi.fn(() => ({ user: { id: 'u1' } }))

// Dynamic import AFTER mocks
const { useMyPromptys } = await import('./useMyPromptys')
// useAuthStore import preserved for module side effects (mock registration timing)
await import('@/stores/auth.store')

// -----------------------------------------------------------------
// Helper: make a thenable chain for .select().eq().eq().order()
// returning the given data on .then()
// -----------------------------------------------------------------
function makePromptsChain(data: unknown[]) {
  const chain: Record<string, unknown> = {}
  const resolve = { data, error: null }
  const methods = ['select', 'eq', 'order']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (cb: (v: typeof resolve) => void) => cb(resolve)
  return chain
}

// Helper: make a thenable chain for count queries
// .select('*', {count, head}).eq().eq() → { count, error: null }
function makeCountChain(count: number) {
  const chain: Record<string, unknown> = {}
  const resolve = { count, error: null }
  const methods = ['select', 'eq']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (cb: (v: typeof resolve) => void) => cb(resolve)
  return chain
}

describe('useMyPromptys', () => {
  beforeEach(() => {
    fromMock.mockReset()
    authStoreSpy = vi.fn(() => ({ user: { id: 'u1' } }))
  })

  // Test 1 (CREAT-03): unauthenticated → empty list, not loading
  it('CREAT-03: returns { promptys: [], loading: false } when user is null', async () => {
    authStoreSpy = vi.fn(() => ({ user: null }))

    const { result } = renderHook(() => useMyPromptys())

    await waitFor(() => {
      expect(result.current.promptys).toEqual([])
      expect(result.current.loading).toBe(false)
    })
  })

  // Test 2 (CREAT-03): hook calls promptys with author_id and status=published
  it('CREAT-03: calls supabase.from("promptys").select with eq(author_id) and eq(status, published)', async () => {
    const promptysChain = makePromptsChain([])
    fromMock.mockImplementation((table: string) => {
      if (table === 'promptys') return promptysChain
      return makeCountChain(0)
    })

    renderHook(() => useMyPromptys())

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('promptys')
      const eqCalls = (promptysChain.eq as ReturnType<typeof vi.fn>).mock.calls
      expect(eqCalls.some((c: unknown[]) => c[0] === 'author_id' && c[1] === 'u1')).toBe(true)
      expect(eqCalls.some((c: unknown[]) => c[0] === 'status' && c[1] === 'published')).toBe(true)
    })
  })

  // Test 3 (CREAT-03): for each prompty, fetches three counts in parallel
  it('CREAT-03: fetches point_events, prompty_saves, prompty_tests counts per prompty', async () => {
    const promptData = [
      {
        id: 'p1',
        title: 'My Prompty',
        cover_url: null,
        cover_gradient: null,
        slug: 'my-prompty',
        created_at: '2026-05-01T00:00:00Z',
      },
    ]
    const promptysChain = makePromptsChain(promptData)

    fromMock.mockImplementation((table: string) => {
      if (table === 'promptys') return promptysChain
      if (table === 'point_events') return makeCountChain(3)
      if (table === 'prompty_saves') return makeCountChain(7)
      if (table === 'prompty_tests') return makeCountChain(2)
      return makeCountChain(0)
    })

    renderHook(() => useMyPromptys())

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('point_events')
      expect(fromMock).toHaveBeenCalledWith('prompty_saves')
      expect(fromMock).toHaveBeenCalledWith('prompty_tests')
    })
  })

  // Test 4 (CREAT-03): final shape includes copies, saves, feedbacks fields
  it('CREAT-03: enriched promptys include copies, saves, feedbacks numeric fields', async () => {
    const promptData = [
      {
        id: 'p1',
        title: 'My Prompty',
        cover_url: null,
        cover_gradient: null,
        slug: 'my-prompty-abc123',
        created_at: '2026-05-01T00:00:00Z',
      },
    ]
    const promptysChain = makePromptsChain(promptData)

    fromMock.mockImplementation((table: string) => {
      if (table === 'promptys') return promptysChain
      if (table === 'point_events') return makeCountChain(3)
      if (table === 'prompty_saves') return makeCountChain(7)
      if (table === 'prompty_tests') return makeCountChain(2)
      return makeCountChain(0)
    })

    const { result } = renderHook(() => useMyPromptys())

    await waitFor(() => {
      expect(result.current.promptys).toHaveLength(1)
      const p = result.current.promptys[0]
      expect(p.copies).toBe(3)
      expect(p.saves).toBe(7)
      expect(p.feedbacks).toBe(2)
      expect(p.id).toBe('p1')
      expect(p.title).toBe('My Prompty')
    })
  })

  // Test 5 (CREAT-03): empty prompty list → no N+1 count calls
  it('CREAT-03: returns empty list and makes no count calls when user has no promptys', async () => {
    const promptysChain = makePromptsChain([])

    fromMock.mockImplementation((table: string) => {
      if (table === 'promptys') return promptysChain
      return makeCountChain(0)
    })

    const { result } = renderHook(() => useMyPromptys())

    await waitFor(() => {
      expect(result.current.promptys).toEqual([])
    })

    // No count queries should fire when promptys list is empty
    expect(fromMock).not.toHaveBeenCalledWith('point_events')
    expect(fromMock).not.toHaveBeenCalledWith('prompty_saves')
    expect(fromMock).not.toHaveBeenCalledWith('prompty_tests')
  })
})
