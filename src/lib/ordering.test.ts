import { describe, expect, it } from 'vitest'
import { getKeyboardTarget, moveCardInState } from './ordering'
import { makeBoard, must } from '@/test/fixtures'

const NOW = '2026-04-04T00:00:00.000Z'

describe('moveCardInState', () => {
  it('reorders inside a column; toIndex is the final index among the other cards', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })

    const toEnd = must(moveCardInState(state, 'a', 'todo', 2, NOW))
    const toTop = must(moveCardInState(state, 'c', 'todo', 0, NOW))
    const toMiddle = must(moveCardInState(state, 'a', 'todo', 1, NOW))

    expect(toEnd.columns.todo.cardIds).toEqual(['b', 'c', 'a'])
    expect(toTop.columns.todo.cardIds).toEqual(['c', 'a', 'b'])
    expect(toMiddle.columns.todo.cardIds).toEqual(['b', 'a', 'c'])
  })

  it('returns null when the card would not move', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })

    expect(moveCardInState(state, 'a', 'todo', 0, NOW)).toBeNull()
    expect(moveCardInState(state, 'b', 'todo', 1, NOW)).toBeNull()
    expect(moveCardInState(state, 'c', 'todo', 2, NOW)).toBeNull()
  })

  it('clamps an out-of-range index', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })

    expect(
      must(moveCardInState(state, 'a', 'todo', 99, NOW)).columns.todo.cardIds,
    ).toEqual(['b', 'c', 'a'])
    expect(
      must(moveCardInState(state, 'c', 'todo', -5, NOW)).columns.todo.cardIds,
    ).toEqual(['c', 'a', 'b'])
  })

  it('leaves every card object untouched when reordering inside one column', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })
    const next = must(moveCardInState(state, 'a', 'todo', 2, NOW))

    // Same object: memoized card components do not re-render for a reorder.
    expect(next.cards).toBe(state.cards)
  })

  it('moves across columns: both lists and the card itself change', () => {
    const state = makeBoard({ todo: ['a', 'b'], doing: ['c', 'd'] })
    const next = must(moveCardInState(state, 'a', 'doing', 1, NOW))

    expect(next.columns.todo.cardIds).toEqual(['b'])
    expect(next.columns.doing.cardIds).toEqual(['c', 'a', 'd'])
    expect(next.cards.a.columnId).toBe('doing')
    expect(next.cards.a.updatedAt).toBe(NOW)
    // Cards that did not move keep their identity.
    expect(next.cards.b).toBe(state.cards.b)
  })

  it('moves into an empty column', () => {
    const state = makeBoard({ todo: ['a'], done: [] })
    const next = must(moveCardInState(state, 'a', 'done', 0, NOW))

    expect(next.columns.todo.cardIds).toEqual([])
    expect(next.columns.done.cardIds).toEqual(['a'])
  })

  it('does not mutate its input', () => {
    const state = makeBoard({ todo: ['a', 'b'], doing: ['c'] })
    const before = JSON.parse(JSON.stringify(state)) as unknown

    moveCardInState(state, 'a', 'doing', 0, NOW)

    expect(state).toEqual(before)
  })

  it('returns null for an unknown card or column', () => {
    const state = makeBoard({ todo: ['a'] })

    expect(moveCardInState(state, 'ghost', 'todo', 0, NOW)).toBeNull()
    expect(moveCardInState(state, 'a', 'ghost', 0, NOW)).toBeNull()
  })
})

describe('getKeyboardTarget', () => {
  const state = makeBoard({ todo: ['a', 'b', 'c'], doing: ['d'], done: [] })

  it('moves up and down inside a column', () => {
    expect(getKeyboardTarget(state, 'b', 'up')).toEqual({
      columnId: 'todo',
      index: 0,
    })
    expect(getKeyboardTarget(state, 'b', 'down')).toEqual({
      columnId: 'todo',
      index: 2,
    })
  })

  it('stops at the top and bottom of a column', () => {
    expect(getKeyboardTarget(state, 'a', 'up')).toBeNull()
    expect(getKeyboardTarget(state, 'c', 'down')).toBeNull()
  })

  it('moves to the neighbouring column, keeping the position when it fits', () => {
    expect(getKeyboardTarget(state, 'b', 'right')).toEqual({
      columnId: 'doing',
      index: 1,
    })
    expect(getKeyboardTarget(state, 'd', 'left')).toEqual({
      columnId: 'todo',
      index: 0,
    })
  })

  it('lands at the end of a shorter column, and in an empty one', () => {
    expect(getKeyboardTarget(state, 'c', 'right')).toEqual({
      columnId: 'doing',
      index: 1,
    })
    expect(getKeyboardTarget(state, 'd', 'right')).toEqual({
      columnId: 'done',
      index: 0,
    })
  })

  it('stops at the first and last column', () => {
    expect(getKeyboardTarget(state, 'a', 'left')).toBeNull()
    const lastColumn = makeBoard({ todo: ['a'], done: ['z'] })
    expect(getKeyboardTarget(lastColumn, 'z', 'right')).toBeNull()
  })

  it('returns null for an unknown card', () => {
    expect(getKeyboardTarget(state, 'ghost', 'up')).toBeNull()
  })
})
