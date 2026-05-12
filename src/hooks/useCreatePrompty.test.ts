import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'p1', slug: 'test-x7k2p9' }, error: null }) }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'u1/test.webp' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/test.webp' } }),
      }),
    },
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'u1' } }) },
}))

describe('useCreatePrompty', () => {
  it.skip('CREAT-01: publish() inserts row with title/template/difficulty and status=published', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-01: publish() returns generated slug suffix (kebab-case + random suffix)', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-04: publish() with parentId sets parent_id on insert payload', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-05: publish() with advancedTemplate creates prompty_versions snapshot', () => {
    expect(true).toBe(true)
  })

  it.skip('CREAT-01: publish() with no user returns ok=false with error message', () => {
    expect(true).toBe(true)
  })
})
