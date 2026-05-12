import { describe, it, expect } from 'vitest'

describe('SearchPage', () => {
  it.todo('FEED-07: typing debounces 300ms before triggering useSearch')
  it.todo('FEED-06: tapping category chip filters results')
  it.todo('FEED-06: tapping model chip filters results')
  it.todo('renders idle empty state when no query + no filters')
  it.todo('renders "Nenhum resultado" when query active but 0 results')
  it.todo('renders SkeletonCard ×2 during initial load')
  it.todo('reuses FeedCard for result items')

  it('Wave 0 scaffold is registered (todos above will be filled by plan 02-03)', () => {
    expect(true).toBe(true)
  })
})
