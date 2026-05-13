import { describe, it, expect, beforeEach, vi } from 'vitest'

const fromMock = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

const { useAuthStore } = await import('./auth.store')

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: true })
  })

  it('starts with null user, null profile, loading=true', () => {
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.profile).toBeNull()
    expect(s.loading).toBe(true)
  })

  it('setUser updates user', () => {
    const fakeUser = { id: 'abc', email: 't@t.com' } as never
    useAuthStore.getState().setUser(fakeUser)
    expect(useAuthStore.getState().user).toEqual(fakeUser)
  })

  it('setProfile updates profile', () => {
    const fakeProfile = { id: 'abc', level: 'L1', points: 0 } as never
    useAuthStore.getState().setProfile(fakeProfile)
    expect(useAuthStore.getState().profile).toEqual(fakeProfile)
  })

  it('setLoading updates loading', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().loading).toBe(false)
  })

  it('reset clears user and profile, sets loading=false', () => {
    const fakeUser = { id: 'abc' } as never
    useAuthStore.getState().setUser(fakeUser)
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().profile).toBeNull()
    expect(useAuthStore.getState().loading).toBe(false)
  })
})

describe('refetchProfile', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    fromMock.mockReset()
  })

  it('fetches profile row and calls setProfile when user is set', async () => {
    const fakeProfile = { id: 'u1', points: 100 } as never
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakeProfile, error: null }),
    }
    fromMock.mockReturnValue(chain)
    await useAuthStore.getState().refetchProfile()
    expect(useAuthStore.getState().profile).toEqual(fakeProfile)
  })

  it('no-op when user is null', async () => {
    useAuthStore.setState({ user: null })
    await useAuthStore.getState().refetchProfile()
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('does not call setProfile when supabase returns error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    }
    fromMock.mockReturnValue(chain)
    const prevProfile = useAuthStore.getState().profile
    await useAuthStore.getState().refetchProfile()
    expect(useAuthStore.getState().profile).toBe(prevProfile)
  })
})
