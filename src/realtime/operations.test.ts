import { describe, expect, it } from 'vitest'
import { applyOperation, diffCardPatch } from './operations'
import {
  AT,
  makeBoard,
  makeCard,
  makeComment,
  makeOp,
  run,
  runAll,
  withComments,
} from '@/test/fixtures'

describe('card.create', () => {
  it('appends the card to its column', () => {
    const state = makeBoard({ todo: ['a', 'b'] })
    const next = run(state, {
      type: 'card.create',
      card: makeCard('x', 'todo'),
    })

    expect(next.columns.todo.cardIds).toEqual(['a', 'b', 'x'])
    expect(next.cards.x.title).toBe('Card x')
  })

  it('ignores a duplicate (the same operation delivered twice)', () => {
    const state = makeBoard({ todo: ['a'] })
    const once = run(state, {
      type: 'card.create',
      card: makeCard('x', 'todo'),
    })
    const twice = applyOperation(
      once,
      makeOp({ type: 'card.create', card: makeCard('x', 'todo') }),
    )

    expect(twice).toBe(once)
  })

  it('is dropped when its column was deleted by someone else', () => {
    const state = makeBoard({ todo: ['a'] })

    expect(
      run(state, { type: 'card.create', card: makeCard('x', 'gone') }),
    ).toBe(state)
  })
})

describe('card.update (field-level merge)', () => {
  it('keeps edits to different fields from two users', () => {
    const state = makeBoard({ todo: ['a'] })
    const afterUserOne = run(state, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Renamed' },
    })
    const afterUserTwo = run(afterUserOne, {
      type: 'card.update',
      cardId: 'a',
      patch: { tags: ['urgent'] },
    })

    expect(afterUserTwo.cards.a).toMatchObject({
      title: 'Renamed',
      tags: ['urgent'],
    })
  })

  it('lets the operation applied last win when both edit the same field', () => {
    const state = makeBoard({ todo: ['a'] })
    const first = run(state, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'One' },
    })
    const second = run(first, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Two' },
    })

    expect(second.cards.a.title).toBe('Two')
  })

  it('stamps the card with the time of the change', () => {
    const state = makeBoard({ todo: ['a'] })
    const next = run(state, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'New' },
    })

    expect(next.cards.a.updatedAt).toBe(AT)
  })

  it('changes nothing when the patch matches the card', () => {
    const state = makeBoard({ todo: ['a'] })

    expect(
      run(state, {
        type: 'card.update',
        cardId: 'a',
        patch: { title: 'Card a', tags: [] },
      }),
    ).toBe(state)
  })

  it('loses to a delete: editing a deleted card does nothing', () => {
    const state = makeBoard({ todo: ['a'] })
    const deleted = run(state, { type: 'card.delete', cardId: 'a' })

    expect(
      run(deleted, {
        type: 'card.update',
        cardId: 'a',
        patch: { title: 'Late' },
      }),
    ).toBe(deleted)
  })
})

describe('diffCardPatch', () => {
  const card = makeCard('a', 'todo', { tags: ['x', 'y'] })

  it('keeps only the fields that differ', () => {
    expect(diffCardPatch(card, { title: 'New', description: '' })).toEqual({
      title: 'New',
    })
  })

  it('compares tags by value, not by reference', () => {
    expect(diffCardPatch(card, { tags: ['x', 'y'] })).toBeNull()
    expect(diffCardPatch(card, { tags: ['y', 'x'] })).toEqual({
      tags: ['y', 'x'],
    })
  })

  it('returns null when nothing differs', () => {
    expect(diffCardPatch(card, { title: card.title, dueDate: null })).toBeNull()
  })
})

describe('card.move (anchored positions)', () => {
  it('places the card after its anchor', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })

    expect(
      run(state, {
        type: 'card.move',
        cardId: 'a',
        toColumnId: 'todo',
        afterCardId: 'b',
      }).columns.todo.cardIds,
    ).toEqual(['b', 'a', 'c'])
    expect(
      run(state, {
        type: 'card.move',
        cardId: 'c',
        toColumnId: 'todo',
        afterCardId: null,
      }).columns.todo.cardIds,
    ).toEqual(['c', 'a', 'b'])
  })

  it('puts the card at the end when its anchor is gone', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })
    const next = run(state, {
      type: 'card.move',
      cardId: 'a',
      toColumnId: 'todo',
      afterCardId: 'ghost',
    })

    expect(next.columns.todo.cardIds).toEqual(['b', 'c', 'a'])
  })

  it('still lands in the right place after a concurrent insert above it', () => {
    // User 2 moves "c" to sit after "a", meaning to do so on the list they saw: [a, b, c].
    // Before that arrives, user 1 puts "z" at the very top.
    const state = makeBoard({ todo: ['a', 'b', 'c'], doing: ['z'] })
    const afterUserOne = run(state, {
      type: 'card.move',
      cardId: 'z',
      toColumnId: 'todo',
      afterCardId: null,
    })
    const afterUserTwo = run(afterUserOne, {
      type: 'card.move',
      cardId: 'c',
      toColumnId: 'todo',
      afterCardId: 'a',
    })

    // An index-based move would have put "c" at index 1, i.e. before "a".
    expect(afterUserTwo.columns.todo.cardIds).toEqual(['z', 'a', 'c', 'b'])
  })

  it('is idempotent: delivering the same move twice changes nothing the second time', () => {
    const state = makeBoard({ todo: ['a', 'b', 'c'] })
    const input = {
      type: 'card.move',
      cardId: 'a',
      toColumnId: 'todo',
      afterCardId: 'b',
    } as const
    const once = run(state, input)

    expect(run(once, input)).toBe(once)
  })

  it('is ignored when the card or the target column no longer exists', () => {
    const state = makeBoard({ todo: ['a'] })

    expect(
      run(state, {
        type: 'card.move',
        cardId: 'ghost',
        toColumnId: 'todo',
        afterCardId: null,
      }),
    ).toBe(state)
    expect(
      run(state, {
        type: 'card.move',
        cardId: 'a',
        toColumnId: 'ghost',
        afterCardId: null,
      }),
    ).toBe(state)
  })
})

describe('deleting things removes what belonged to them', () => {
  const withThread = () =>
    withComments(makeBoard({ todo: ['a', 'b'], doing: ['c'] }), [
      makeComment('c1', 'a'),
      makeComment('c2', 'a', 'c1'),
      makeComment('c3', 'c'),
    ])

  it('card.delete removes the card and its whole comment thread', () => {
    const next = run(withThread(), { type: 'card.delete', cardId: 'a' })

    expect(next.cards.a).toBeUndefined()
    expect(next.columns.todo.cardIds).toEqual(['b'])
    expect(Object.keys(next.comments)).toEqual(['c3'])
    expect(next.commentChildren).toEqual({ c: ['c3'] })
  })

  it('column.delete removes its cards, their comments and the board entry', () => {
    const next = run(withThread(), { type: 'column.delete', columnId: 'todo' })

    expect(next.columns.todo).toBeUndefined()
    expect(next.boards.b1.columnIds).toEqual(['doing'])
    expect(Object.keys(next.cards)).toEqual(['c'])
    expect(Object.keys(next.comments)).toEqual(['c3'])
  })

  it('board.delete removes everything under the board', () => {
    const next = run(withThread(), { type: 'board.delete', boardId: 'b1' })

    expect(next.boards).toEqual({})
    expect(next.boardOrder).toEqual([])
    expect(next.columns).toEqual({})
    expect(next.cards).toEqual({})
    expect(next.comments).toEqual({})
    expect(next.commentChildren).toEqual({})
  })

  it('deleting something that is already gone changes nothing', () => {
    const state = makeBoard({ todo: ['a'] })

    expect(run(state, { type: 'card.delete', cardId: 'ghost' })).toBe(state)
    expect(run(state, { type: 'column.delete', columnId: 'ghost' })).toBe(state)
    expect(run(state, { type: 'board.delete', boardId: 'ghost' })).toBe(state)
  })
})

describe('columns', () => {
  it('column.add appends to the board and is ignored for a missing board', () => {
    const state = makeBoard({ todo: ['a'] })
    const column = { id: 'new', boardId: 'b1', title: 'New', cardIds: [] }

    expect(
      run(state, { type: 'column.add', column }).boards.b1.columnIds,
    ).toEqual(['todo', 'new'])
    expect(
      run(state, {
        type: 'column.add',
        column: { ...column, boardId: 'ghost' },
      }),
    ).toBe(state)
  })

  it('column.rename changes only the title', () => {
    const state = makeBoard({ todo: ['a'] })
    const next = run(state, {
      type: 'column.rename',
      columnId: 'todo',
      title: 'Backlog',
    })

    expect(next.columns.todo).toMatchObject({
      title: 'Backlog',
      cardIds: ['a'],
    })
  })

  it('runAll applies a sequence in order', () => {
    const state = makeBoard({ todo: ['a', 'b'] })
    const next = runAll(state, [
      { type: 'card.move', cardId: 'a', toColumnId: 'todo', afterCardId: 'b' },
      { type: 'card.delete', cardId: 'b' },
    ])

    expect(next.columns.todo.cardIds).toEqual(['a'])
  })
})
