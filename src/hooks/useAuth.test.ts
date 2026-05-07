import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase singleton BEFORE importing useAuth.
const signUp = vi.fn()
const signInWithPassword = vi.fn()
const signOut = vi.fn()
const resetPasswordForEmail = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp, signInWithPassword, signOut, resetPasswordForEmail },
  },
}))

// useAuth must be imported AFTER mocking
const { useAuth } = await import('./useAuth')
const { useAuthStore } = await import('@/stores/auth.store')

describe('useAuth', () => {
  beforeEach(() => {
    signUp.mockReset()
    signInWithPassword.mockReset()
    signOut.mockReset()
    resetPasswordForEmail.mockReset()
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('signUp calls supabase.auth.signUp with email/password', async () => {
    signUp.mockResolvedValue({ data: {}, error: null })
    const { signUp: doSignUp } = useAuth()
    const r = await doSignUp('a@a.com', 'password123')
    expect(signUp).toHaveBeenCalledWith({ email: 'a@a.com', password: 'password123' })
    expect(r).toEqual({})
  })

  it('signUp returns mapped error message for "already registered"', async () => {
    signUp.mockResolvedValue({ data: null, error: { message: 'User already registered' } })
    const { signUp: doSignUp } = useAuth()
    const r = await doSignUp('a@a.com', 'pw')
    expect(r.error).toMatch(/já está em uso/)
  })

  it('signIn calls supabase.auth.signInWithPassword', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null })
    const { signIn } = useAuth()
    await signIn('a@a.com', 'pw')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@a.com', password: 'pw' })
  })

  it('signIn returns mapped error for invalid credentials', async () => {
    signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    })
    const { signIn } = useAuth()
    const r = await signIn('a@a.com', 'wrong')
    expect(r.error).toMatch(/E-mail ou senha incorretos/)
  })

  it('signOut calls supabase.auth.signOut and resets store', async () => {
    signOut.mockResolvedValue({ error: null })
    useAuthStore.setState({ user: { id: 'x' } as never, profile: null, loading: false })
    const { signOut: doSignOut } = useAuth()
    await doSignOut()
    expect(signOut).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('resetPassword calls resetPasswordForEmail with email', async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    const { resetPassword } = useAuth()
    await resetPassword('a@a.com')
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1)
    const [emailArg] = resetPasswordForEmail.mock.calls[0]
    expect(emailArg).toBe('a@a.com')
  })
})
