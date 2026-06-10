import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Per-table fixtures so the three recents sources can return different rows
const tableData: Record<string, unknown[]> = {}

function makeChain(table: string) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'order', 'limit', 'in', 'maybeSingle', 'update']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  chain.then = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolve({ data: tableData[table] ?? [], error: null })
  return chain
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => makeChain(table)),
  },
}))

const { useProfile } = await import('./useProfile')
const { useAuthStore } = await import('@/stores/auth.store')

const prompty = (id: string, title: string) => ({
  id,
  title,
  cover_url: null,
  cover_gradient: null,
})

describe('useProfile recents (copies + saves + tests)', () => {
  beforeEach(() => {
    for (const k of Object.keys(tableData)) delete tableData[k]
    useAuthStore.setState({
      user: { id: 'u1' } as never,
      profile: null,
      loading: false,
    })
  })

  it('includes copied promptys (point_events copy) in recents and usedCount', async () => {
    tableData['point_events'] = [
      { ref_id: 'p1', created_at: '2026-06-02T00:00:00Z' },
      { ref_id: 'p2', created_at: '2026-06-01T00:00:00Z' },
    ]
    tableData['promptys'] = [prompty('p1', 'Copiado A'), prompty('p2', 'Copiado B')]
    tableData['prompty_saves'] = []
    tableData['prompty_tests'] = []

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.usedCount).toBe(2))
    expect(result.current.recents.map((r) => r.id)).toEqual(['p1', 'p2'])
  })

  it('dedupes the same prompty across copy + save and counts it once', async () => {
    tableData['point_events'] = [{ ref_id: 'p1', created_at: '2026-06-02T00:00:00Z' }]
    tableData['promptys'] = [prompty('p1', 'Mesmo Prompty')]
    tableData['prompty_saves'] = [
      {
        prompty_id: 'p1',
        created_at: '2026-06-01T00:00:00Z',
        promptys: prompty('p1', 'Mesmo Prompty'),
      },
    ]
    tableData['prompty_tests'] = []

    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.usedCount).toBe(1))
    expect(result.current.recents).toHaveLength(1)
  })

  it('returns zero recents and usedCount when logged out', async () => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
    const { result } = renderHook(() => useProfile())
    await waitFor(() => expect(result.current.recentsLoading).toBe(false))
    expect(result.current.usedCount).toBe(0)
    expect(result.current.recents).toEqual([])
  })
})
