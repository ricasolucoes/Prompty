import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGenerate } from './useGenerate'

const mockInvoke = vi.fn()
const mockRefetchProfile = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ refetchProfile: mockRefetchProfile }),
  },
}))

describe('useGenerate (GEN-03, GEN-05)', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    mockRefetchProfile.mockReset()
  })

  it('GEN-05: state goes idle → loading → done with signedUrl when invoke returns { data: { signed_url } }', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { signed_url: 'https://x/y.webp', balance: 0 },
      error: null,
    })

    const { result } = renderHook(() => useGenerate())
    expect(result.current.state).toBe('idle')

    await act(async () => {
      await result.current.generate('p1', 'A beautiful photo')
    })

    expect(result.current.state).toBe('done')
    expect(result.current.signedUrl).toBe('https://x/y.webp')
    expect(result.current.errorMsg).toBeNull()
  })

  it('GEN-05: state goes idle → loading → error with errorMsg when invoke returns an error or data.error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { error: 'no_credits' },
      error: { message: 'Function error', context: { status: 402 } },
    })

    const { result } = renderHook(() => useGenerate())

    await act(async () => {
      await result.current.generate('p1', 'A beautiful photo')
    })

    expect(result.current.state).toBe('error')
    expect(result.current.errorMsg).toBe('no_credits')
    expect(result.current.signedUrl).toBeNull()
  })

  it('GEN-03: calling generate() twice while state===loading does not start a second invoke (button-disable + guard)', async () => {
    // Create a deferred promise so we can control when the invoke resolves
    let resolveInvoke!: (v: unknown) => void
    const deferred = new Promise((res) => { resolveInvoke = res })
    mockInvoke.mockReturnValueOnce(deferred)

    const { result } = renderHook(() => useGenerate())

    // Start two calls nearly simultaneously
    act(() => {
      void result.current.generate('p1', 'photo')
      void result.current.generate('p1', 'photo') // second call should be no-op
    })

    // Only one invoke should have been issued
    expect(mockInvoke).toHaveBeenCalledTimes(1)

    // Resolve the deferred to allow state to settle
    await act(async () => {
      resolveInvoke({ data: { signed_url: 'https://x/y.webp' }, error: null })
      await deferred
    })
  })

  it('GEN-01/05: refetchProfile is called after invoke resolves (badge decrement) — success AND error', async () => {
    // Success case
    mockInvoke.mockResolvedValueOnce({
      data: { signed_url: 'https://x/y.webp', balance: 0 },
      error: null,
    })

    const { result } = renderHook(() => useGenerate())

    await act(async () => {
      await result.current.generate('p1', 'photo')
    })

    expect(mockRefetchProfile).toHaveBeenCalledTimes(1)

    // Error case — refetch should also happen
    mockInvoke.mockResolvedValueOnce({
      data: { error: 'no_credits' },
      error: { message: 'error' },
    })

    await act(async () => {
      await result.current.generate('p1', 'photo')
    })

    expect(mockRefetchProfile).toHaveBeenCalledTimes(2)
  })
})
