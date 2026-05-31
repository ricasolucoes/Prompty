import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const { useCredits } = await import('./useCredits')
const { useAuthStore } = await import('@/stores/auth.store')

describe('useCredits', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('returns 0 when profile is null (null-safe default)', () => {
    useAuthStore.setState({ profile: null })
    const { result } = renderHook(() => useCredits())
    expect(result.current.credits).toBe(0)
  })

  it('returns profile.credits when profile has credits', () => {
    useAuthStore.setState({ profile: { credits: 3 } as never })
    const { result } = renderHook(() => useCredits())
    expect(result.current.credits).toBe(3)
  })

  it('returns 0 when profile.credits is 0', () => {
    useAuthStore.setState({ profile: { credits: 0 } as never })
    const { result } = renderHook(() => useCredits())
    expect(result.current.credits).toBe(0)
  })
})
