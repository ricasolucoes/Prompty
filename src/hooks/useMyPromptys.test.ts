import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'u1' } }),
}))

describe('useMyPromptys', () => {
  it.skip('CREAT-03: returns own published promptys with copies/saves/feedbacks counts', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-03: returns empty list when user has no promptys', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-03: returns empty list when not authenticated', () => {
    expect(true).toBe(true)
  })
})
