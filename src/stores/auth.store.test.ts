import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'

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
