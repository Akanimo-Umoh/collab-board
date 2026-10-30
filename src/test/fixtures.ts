import {
  applyOperation,
  type DomainSnapshot,
  type Operation,
  type OperationInput,
} from '@/realtime/operations'
import type { Board, Card, CardComment, Column, ID } from '@/types/domain'

export const AT = '2026-03-03T10:00:00.000Z'
const EARLIER = '2026-01-01T00:00:00.000Z'

/** Narrows a possibly-missing value, failing the test with a clear error if it is missing. */
export function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected a value')
  return value
}

export const emptySnapshot = (): DomainSnapshot => ({
  boardOrder: [],
  boards: {},
  columns: {},
  cards: {},
  comments: {},
  commentChildren: {},
})

export function makeCard(
  id: ID,
  columnId: ID,
  overrides: Partial<Card> = {},
): Card {
  return {
    id,
    columnId,
    title: `Card ${id}`,
    description: '',
    tags: [],
    dueDate: null,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    ...overrides,
  }
}

export function makeComment(
  id: ID,
  cardId: ID,
  parentId: ID | null = null,
  overrides: Partial<CardComment> = {},
): CardComment {
  return {
    id,
    cardId,
    parentId,
    authorId: 'author-1',
    authorName: 'Ada',
    body: `Comment ${id}`,
    createdAt: EARLIER,
    updatedAt: EARLIER,
    deleted: false,
    ...overrides,
  }
}

/**
 * One board "b1". Each key of `layout` is a column (its id and its title),
 * each value its card ids in order: { todo: ['a', 'b'], doing: ['c'] }.
 * Card titles are "Card <id>".
 */
export function makeBoard(layout: Record<string, ID[]>): DomainSnapshot {
  const board: Board = {
    id: 'b1',
    title: 'Board',
    description: '',
    createdAt: EARLIER,
    columnIds: Object.keys(layout),
  }
  const columns: Record<ID, Column> = {}
  const cards: Record<ID, Card> = {}

  for (const [columnId, cardIds] of Object.entries(layout)) {
    columns[columnId] = {
      id: columnId,
      boardId: 'b1',
      title: columnId,
      cardIds,
    }
    for (const cardId of cardIds) cards[cardId] = makeCard(cardId, columnId)
  }

  return {
    ...emptySnapshot(),
    boardOrder: ['b1'],
    boards: { b1: board },
    columns,
    cards,
  }
}

let counter = 0

/** A complete operation with predictable metadata. */
export function makeOp(input: OperationInput): Operation {
  counter += 1
  return { ...input, opId: `op-${counter}`, at: AT, by: 'Tester' } as Operation
}

/** Applies one operation. */
export function run(
  state: DomainSnapshot,
  input: OperationInput,
): DomainSnapshot {
  return applyOperation(state, makeOp(input))
}

/** Applies several operations in order. */
export function runAll(
  state: DomainSnapshot,
  inputs: readonly OperationInput[],
): DomainSnapshot {
  return inputs.reduce(run, state)
}

export function withComments(
  state: DomainSnapshot,
  comments: readonly CardComment[],
): DomainSnapshot {
  return runAll(
    state,
    comments.map((comment): OperationInput => ({
      type: 'comment.add',
      comment,
    })),
  )
}
