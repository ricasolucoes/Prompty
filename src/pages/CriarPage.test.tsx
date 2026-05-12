import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'p1', slug: 'test-x7k2p9' }, error: null }) }) }),
    }),
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  },
}))

let mockUser: { id: string } | null = { id: 'u1' }
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null; profile: { points: number } | null }) => unknown) =>
    selector({ user: mockUser, profile: { points: 300 } }),
}))

describe('CriarPage', () => {
  it.skip('CREAT-01: renders wizard step 1 (Dados básicos) on mount at /criar', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-04: pre-fills wizard with parent prompty data when ?from=<id> query param present', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-01: progress bar shows "1 de 4" on step 1', () => {
    expect(true).toBe(true)
  })
})
