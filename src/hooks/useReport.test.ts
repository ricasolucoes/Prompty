import { describe, it, expect, vi, beforeEach } from 'vitest'

const insertMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: (payload: unknown) => {
        insertMock(payload)
        return Promise.resolve({ error: insertMock.mock.results.at(-1)?.value ?? null })
      },
    }),
  },
}))

const { useReport } = await import('./useReport')
const { useAuthStore } = await import('@/stores/auth.store')

describe('useReport', () => {
  beforeEach(() => {
    insertMock.mockReset()
    insertMock.mockReturnValue(null) // null = no error
    useAuthStore.setState({ user: null, profile: null, loading: false })
  })

  it('returns {ok:false} when user is null', async () => {
    const { submit } = useReport()
    const result = await submit({ prompty_id: 'p1', type: 'report', reason: 'spam' })
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('CUR-05/MODR-01: submit({type:report}) inserts row with type=report', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    const { submit } = useReport()
    const result = await submit({ prompty_id: 'p1', type: 'report', reason: 'spam' })
    expect(result.ok).toBe(true)
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: 'u1',
      prompty_id: 'p1',
      type: 'report',
      reason: 'spam',
      notes: null,
    })
  })

  it('CUR-04: submit({type:category_suggestion}) inserts row with type=category_suggestion', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    const { submit } = useReport()
    const result = await submit({
      prompty_id: 'p1',
      type: 'category_suggestion',
      reason: 'Retrato',
      notes: 'O atual está errado',
    })
    expect(result.ok).toBe(true)
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: 'u1',
      prompty_id: 'p1',
      type: 'category_suggestion',
      reason: 'Retrato',
      notes: 'O atual está errado',
    })
  })

  it('notes field is optional — when omitted, insert payload has notes: null', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    const { submit } = useReport()
    const result = await submit({ prompty_id: 'p1', type: 'report', reason: 'spam' })
    expect(result.ok).toBe(true)
    const payload = insertMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(payload.notes).toBeNull()
  })

  it('returns {ok:false,error} when supabase returns an error', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as never, profile: null, loading: false })
    insertMock.mockReturnValue({ message: 'unique constraint violation' })
    const { submit } = useReport()
    const result = await submit({ prompty_id: 'p1', type: 'report', reason: 'spam' })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('Não foi possível enviar.')
  })
})
