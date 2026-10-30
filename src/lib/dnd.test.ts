import { describe, expect, it } from 'vitest'
import { findInsertIndex, getEdgeScrollDelta, getInsertIndex } from './dnd'

describe('getInsertIndex', () => {
  const midpoints = [10, 30, 50] // three cards, top to bottom

  it('inserts at the top when the pointer is above every card', () => {
    expect(getInsertIndex(midpoints, 0)).toBe(0)
  })

  it('inserts between cards', () => {
    expect(getInsertIndex(midpoints, 20)).toBe(1)
    expect(getInsertIndex(midpoints, 40)).toBe(2)
  })

  it('inserts at the end when the pointer is below every card', () => {
    expect(getInsertIndex(midpoints, 99)).toBe(3)
  })

  it('treats a pointer exactly on a midpoint as above that card', () => {
    expect(getInsertIndex(midpoints, 30)).toBe(1)
  })

  it('handles an empty column', () => {
    expect(getInsertIndex([], 5)).toBe(0)
  })
})

describe('findInsertIndex', () => {
  it('measures only a handful of cards in a long column (binary search)', () => {
    let reads = 0
    const index = findInsertIndex(
      1000,
      (i) => {
        reads += 1
        return i * 10 + 5
      },
      5003,
    )

    expect(index).toBe(500)
    expect(reads).toBeLessThanOrEqual(11)
  })
})

describe('getEdgeScrollDelta', () => {
  it('does not scroll while the pointer is away from the edges', () => {
    expect(getEdgeScrollDelta(500, 0, 1000)).toBe(0)
  })

  it('scrolls toward the start, faster the closer the pointer gets', () => {
    expect(getEdgeScrollDelta(0, 0, 1000)).toBe(-18)
    expect(getEdgeScrollDelta(32, 0, 1000)).toBe(-9)
  })

  it('scrolls toward the end, faster the closer the pointer gets', () => {
    expect(getEdgeScrollDelta(1000, 0, 1000)).toBe(18)
    expect(getEdgeScrollDelta(968, 0, 1000)).toBe(9)
  })

  it('uses full speed when the pointer is past the edge', () => {
    expect(getEdgeScrollDelta(-50, 0, 1000)).toBe(-18)
    expect(getEdgeScrollDelta(1050, 0, 1000)).toBe(18)
  })

  it('respects a custom edge size and speed', () => {
    expect(getEdgeScrollDelta(10, 0, 100, 20, 10)).toBe(-5)
  })
})
