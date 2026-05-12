import { describe, it, expect } from 'vitest'

describe('useReport', () => {
  it.todo('CUR-05/MODR-01: submit({type:report}) inserts row into reports')
  it.todo('CUR-04: submit({type:category_suggestion}) inserts row with type=category_suggestion')
  it.todo('returns {ok:false} when user is null')
  it.todo('returns {ok:false,error} on DB error')
  it.todo('does not modify points or any other table — fire-and-forget')

  it('Wave 0 scaffold is registered (todos above will be filled by plan 02-03)', () => {
    expect(true).toBe(true)
  })
})
