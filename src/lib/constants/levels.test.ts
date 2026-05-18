import { describe, it, expect } from 'vitest'
import { LEVELS, levelOf, nextLevel } from './levels'

describe('LEVELS array', () => {
  it('has exactly 5 levels in order L1..L5', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(['L1', 'L2', 'L3', 'L4', 'L5'])
  })
  it('has min thresholds 0, 50, 250, 1000, 5000', () => {
    expect(LEVELS.map((l) => l.min)).toEqual([0, 50, 250, 1000, 5000])
  })
})

describe('levelOf', () => {
  it('returns L1 for 0 points', () => {
    expect(levelOf(0).id).toBe('L1')
  })
  it('returns L1 for 49 points', () => {
    expect(levelOf(49).id).toBe('L1')
  })
  it('returns L2 for 50 points (boundary)', () => {
    expect(levelOf(50).id).toBe('L2')
  })
  it('returns L2 for 249 points', () => {
    expect(levelOf(249).id).toBe('L2')
  })
  it('returns L3 for 250 points (boundary)', () => {
    expect(levelOf(250).id).toBe('L3')
  })
  it('returns L3 for 999 points', () => {
    expect(levelOf(999).id).toBe('L3')
  })
  it('returns L4 for 1000 points (boundary)', () => {
    expect(levelOf(1000).id).toBe('L4')
  })
  it('returns L5 for 5000 points', () => {
    expect(levelOf(5000).id).toBe('L5')
  })
  it('returns L5 for huge number', () => {
    expect(levelOf(99999).id).toBe('L5')
  })
  it('returns L1 for negative points (defensive)', () => {
    expect(levelOf(-10).id).toBe('L1')
  })
  it('returns L1 for NaN (defensive)', () => {
    expect(levelOf(Number.NaN).id).toBe('L1')
  })
})

describe('nextLevel', () => {
  it('returns L2 from L1', () => {
    expect(nextLevel(LEVELS[0])?.id).toBe('L2')
  })
  it('returns null from L5', () => {
    expect(nextLevel(LEVELS[4])).toBeNull()
  })
})
