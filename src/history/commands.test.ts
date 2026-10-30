import { describe, expect, it } from 'vitest'
import {
  applyOperation,
  type DomainSnapshot,
  type OperationInput,
} from '@/realtime/operations'
import { createHistoryEntry } from './commands'
import {
  makeBoard,
  makeCard,
  makeComment,
  makeOp,
  must,
  run,
  runAll,
  withComments,
} from '@/test/fixtures'

/** Undo and redo stamp a new update time, which is not part of what is being restored. */
const normalize = (state: DomainSnapshot): DomainSnapshot => ({
  ...state,
  cards: Object.fromEntries(
    Object.entries(state.cards).map(([id, card]) => [
      id,
      { ...card, updatedAt: 'normalized' },
    ]),
  ),
})

/** Performs an action, undoes it, redoes it, and returns every state along the way. */
function roundTrip(before: DomainSnapshot, input: OperationInput) {
  const op = makeOp(input)
  const entry = must(createHistoryEntry(op, before))
  const after = applyOperation(before, op)
  const undone = runAll(after, entry.inverse)
  const redone = runAll(undone, entry.forward)
  return { entry, after, undone, redone }
}

describe('undo restores the exact earlier state', () => {
  it('for creating a card', () => {
    const before = makeBoard({ todo: ['a', 'b'] })
    const { entry, after, undone, redone } = roundTrip(before, {
      type: 'card.create',
      card: makeCard('x', 'todo'),
    })

    expect(entry.label).toContain('Card x')
    expect(after.cards.x).toBeDefined()
    expect(normalize(undone)).toEqual(normalize(before))
    expect(normalize(redone)).toEqual(normalize(after))
  })

  it('for deleting a card from the middle of a column, with its comment thread', () => {
    const base = makeBoard({ todo: ['a', 'b', 'c'] })
    const withThread = withComments(base, [
      makeComment('c1', 'b'),
      makeComment('c2', 'b', 'c1'),
      makeComment('c3', 'b'),
    ])
    // One comment in the thread was already deleted: it must come back as a tombstone.
    const before = run(withThread, {
      type: 'comment.delete',
      commentId: 'c3',
      authorId: 'author-1',
    })

    const { after, undone, redone } = roundTrip(before, {
      type: 'card.delete',
      cardId: 'b',
    })

    expect(after.cards.b).toBeUndefined()
    expect(normalize(undone)).toEqual(normalize(before))
    expect(undone.columns.todo.cardIds).toEqual(['a', 'b', 'c'])
    expect(undone.comments.c3).toMatchObject({ deleted: true, body: '' })
    expect(normalize(redone)).toEqual(normalize(after))
  })

  it('for deleting the first card (it must go back to the top)', () => {
    const before = makeBoard({ todo: ['a', 'b', 'c'] })
    const { undone } = roundTrip(before, { type: 'card.delete', cardId: 'a' })

    expect(undone.columns.todo.cardIds).toEqual(['a', 'b', 'c'])
  })

  it('and a last-in-column delete needs no extra move operation', () => {
    const before = makeBoard({ todo: ['a', 'b'] })
    const { entry } = roundTrip(before, { type: 'card.delete', cardId: 'b' })

    expect(entry.inverse.map((op) => op.type)).toEqual(['card.create'])
  })

  it('for moving a card inside a column', () => {
    const before = makeBoard({ todo: ['a', 'b', 'c'] })
    const { after, undone, redone } = roundTrip(before, {
      type: 'card.move',
      cardId: 'a',
      toColumnId: 'todo',
      afterCardId: 'c',
    })

    expect(after.columns.todo.cardIds).toEqual(['b', 'c', 'a'])
    expect(normalize(undone)).toEqual(normalize(before))
    expect(normalize(redone)).toEqual(normalize(after))
  })

  it('for moving a card to another column', () => {
    const before = makeBoard({ todo: ['a', 'b'], doing: ['c'] })
    const { after, undone, redone } = roundTrip(before, {
      type: 'card.move',
      cardId: 'a',
      toColumnId: 'doing',
      afterCardId: 'c',
    })

    expect(after.cards.a.columnId).toBe('doing')
    expect(normalize(undone)).toEqual(normalize(before))
    expect(undone.cards.a.columnId).toBe('todo')
    expect(normalize(redone)).toEqual(normalize(after))
  })

  it('for editing a card', () => {
    const before = makeBoard({ todo: ['a'] })
    const { after, undone, redone } = roundTrip(before, {
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Changed', tags: ['x'] },
    })

    expect(after.cards.a.title).toBe('Changed')
    expect(normalize(undone)).toEqual(normalize(before))
    expect(normalize(redone)).toEqual(normalize(after))
  })
})

describe('undo only reverses your own change', () => {
  it("leaves a teammate's edit to another field alone", () => {
    const before = makeBoard({ todo: ['a'] })
    const op = makeOp({
      type: 'card.update',
      cardId: 'a',
      patch: { title: 'Mine' },
    })
    const entry = must(createHistoryEntry(op, before))

    const afterMine = applyOperation(before, op)
    const afterTeammate = run(afterMine, {
      type: 'card.update',
      cardId: 'a',
      patch: { tags: ['theirs'] },
    })
    const undone = runAll(afterTeammate, entry.inverse)

    expect(undone.cards.a.title).toBe('Card a') // my change is reversed
    expect(undone.cards.a.tags).toEqual(['theirs']) // theirs survives
  })
})

describe('createHistoryEntry', () => {
  const state = makeBoard({ todo: ['a'] })

  it('returns null for actions that are not undoable yet', () => {
    const column = { id: 'new', boardId: 'b1', title: 'New', cardIds: [] }

    expect(
      createHistoryEntry(makeOp({ type: 'column.add', column }), state),
    ).toBeNull()
    expect(
      createHistoryEntry(
        makeOp({ type: 'column.rename', columnId: 'todo', title: 'X' }),
        state,
      ),
    ).toBeNull()
    expect(
      createHistoryEntry(
        makeOp({ type: 'comment.add', comment: makeComment('c1', 'a') }),
        state,
      ),
    ).toBeNull()
  })

  it('returns null when the thing it would restore does not exist', () => {
    expect(
      createHistoryEntry(
        makeOp({ type: 'card.delete', cardId: 'ghost' }),
        state,
      ),
    ).toBeNull()
    expect(
      createHistoryEntry(
        makeOp({
          type: 'card.move',
          cardId: 'ghost',
          toColumnId: 'todo',
          afterCardId: null,
        }),
        state,
      ),
    ).toBeNull()
    expect(
      createHistoryEntry(
        makeOp({ type: 'card.update', cardId: 'ghost', patch: { title: 'X' } }),
        state,
      ),
    ).toBeNull()
  })
})
