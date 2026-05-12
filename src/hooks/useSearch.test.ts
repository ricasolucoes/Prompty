import { describe, it, expect } from 'vitest'

describe('useSearch', () => {
  it.todo('returns infinite query with cursor pagination when query is non-empty (FEED-07)')
  it.todo('applies category filter via .eq(category, value) when category provided (FEED-06)')
  it.todo('applies model filter via .contains(models, [model]) when model provided (FEED-06)')
  it.todo('skips textSearch when query is empty but filters are active (FEED-06)')
  it.todo('uses cursor pagination matching useFeed pattern (created_at + id)')
  it.todo('filters status = published (MODR-03)')

  it('Wave 0 scaffold is registered (todos above will be filled by plan 02-03)', () => {
    // This passing test anchors the describe block so the file is collected by Vitest.
    // The it.todo() entries above document the behavior contracts for plan 02-03.
    expect(true).toBe(true)
  })
})
