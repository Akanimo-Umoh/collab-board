import { createId } from '@/lib/id'
import { moveCardInState } from '@/lib/ordering'
import { withoutKey } from '@/lib/records'
import type { Board, Card, CardInput, Column, ID } from '@/types/domain'

export interface DomainSnapshot {
  boardOrder: ID[]
  boards: Record<ID, Board>
  columns: Record<ID, Column>
  cards: Record<ID, Card>
}

export type CardPatch = Partial<CardInput>

interface OperationMeta {
  /** Unique per operation: receivers use it to drop duplicates and match acknowledgements. */
  opId: ID
  /** When the user made the change. Carried in the operation so every replica writes the same timestamp. */
  at: string
}

export type Operation = OperationMeta &
  (
    | { type: 'board.create'; board: Board }
    | { type: 'board.delete'; boardId: ID }
    | { type: 'column.add'; column: Column }
    | { type: 'column.rename'; columnId: ID; title: string }
    | { type: 'column.delete'; columnId: ID }
    | { type: 'card.create'; card: Card }
    | { type: 'card.update'; cardId: ID; patch: CardPatch }
    /** afterCardId is the card that should sit directly above; null means top of the column. */
    | { type: 'card.move'; cardId: ID; toColumnId: ID; afterCardId: ID | null }
    | { type: 'card.delete'; cardId: ID }
  )

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

export type OperationInput = DistributiveOmit<Operation, 'opId' | 'at'>

export function createOperation(input: OperationInput): Operation {
  return {
    ...input,
    opId: createId(),
    at: new Date().toISOString(),
  } as Operation
}

/* ---------- ordering anchors ---------- */

/** Turns "final index among the other cards" into "the card that sits above". */
export function indexToAnchor(
  cardIds: readonly ID[],
  cardId: ID,
  index: number,
): ID | null {
  const others = cardIds.filter((id) => id !== cardId)
  const clamped = Math.min(Math.max(index, 0), others.length)
  return clamped === 0 ? null : (others[clamped - 1] ?? null)
}

/** The reverse. If the anchor is gone (deleted or moved away), the card goes to the end. */
export function anchorToIndex(
  cardIds: readonly ID[],
  cardId: ID,
  afterCardId: ID | null,
): number {
  const others = cardIds.filter((id) => id !== cardId)
  if (afterCardId === null) return 0
  const at = others.indexOf(afterCardId)
  return at === -1 ? others.length : at + 1
}

/* ---------- card patches ---------- */

const sameTags = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((tag, i) => tag === b[i])

/** Keeps only the fields that really differ, or null if nothing does. */
export function diffCardPatch(card: Card, patch: CardPatch): CardPatch | null {
  const changes: CardPatch = {}
  let changed = false

  if (patch.title !== undefined && patch.title !== card.title) {
    changes.title = patch.title
    changed = true
  }
  if (
    patch.description !== undefined &&
    patch.description !== card.description
  ) {
    changes.description = patch.description
    changed = true
  }
  if (patch.tags !== undefined && !sameTags(patch.tags, card.tags)) {
    changes.tags = patch.tags
    changed = true
  }
  if (patch.dueDate !== undefined && patch.dueDate !== card.dueDate) {
    changes.dueDate = patch.dueDate
    changed = true
  }

  return changed ? changes : null
}

/* ---------- the reducer ---------- */

/**
 * Pure and deterministic: the same state and operation always give the same result, wherever it runs (browser, server, undo/redo).
 * Every case returns the SAME state reference when nothing changes, which makes duplicate or stale operations harmless.
 */
export function applyOperation(
  state: DomainSnapshot,
  op: Operation,
): DomainSnapshot {
  switch (op.type) {
    case 'board.create': {
      if (state.boards[op.board.id]) return state
      return {
        ...state,
        boards: { ...state.boards, [op.board.id]: op.board },
        boardOrder: [op.board.id, ...state.boardOrder], // newest first
      }
    }

    case 'board.delete': {
      const board = state.boards[op.boardId]
      if (!board) return state

      const columns = { ...state.columns }
      const cards = { ...state.cards }
      for (const columnId of board.columnIds) {
        state.columns[columnId]?.cardIds.forEach(
          (cardId) => delete cards[cardId],
        )
        delete columns[columnId]
      }
      return {
        ...state,
        boards: withoutKey(state.boards, op.boardId),
        boardOrder: state.boardOrder.filter((id) => id !== op.boardId),
        columns,
        cards,
      }
    }

    case 'column.add': {
      const board = state.boards[op.column.boardId]
      if (!board || state.columns[op.column.id]) return state
      return {
        ...state,
        columns: { ...state.columns, [op.column.id]: op.column },
        boards: {
          ...state.boards,
          [board.id]: {
            ...board,
            columnIds: [...board.columnIds, op.column.id],
          },
        },
      }
    }

    case 'column.rename': {
      const column = state.columns[op.columnId]
      if (!column || column.title === op.title) return state
      return {
        ...state,
        columns: {
          ...state.columns,
          [column.id]: { ...column, title: op.title },
        },
      }
    }

    case 'column.delete': {
      const column = state.columns[op.columnId]
      if (!column) return state

      const cards = { ...state.cards }
      column.cardIds.forEach((cardId) => delete cards[cardId])

      const board = state.boards[column.boardId]
      return {
        ...state,
        columns: withoutKey(state.columns, op.columnId),
        cards,
        boards: board
          ? {
              ...state.boards,
              [board.id]: {
                ...board,
                columnIds: board.columnIds.filter((id) => id !== op.columnId),
              },
            }
          : state.boards,
      }
    }

    case 'card.create': {
      const column = state.columns[op.card.columnId]
      // The column may have been deleted by someone else in the meantime.
      if (!column || state.cards[op.card.id]) return state
      return {
        ...state,
        cards: { ...state.cards, [op.card.id]: op.card },
        columns: {
          ...state.columns,
          [column.id]: { ...column, cardIds: [...column.cardIds, op.card.id] },
        },
      }
    }

    case 'card.update': {
      const card = state.cards[op.cardId]
      if (!card) return state // deleted elsewhere: delete wins
      const changes = diffCardPatch(card, op.patch)
      if (!changes) return state
      return {
        ...state,
        cards: {
          ...state.cards,
          [card.id]: { ...card, ...changes, updatedAt: op.at },
        },
      }
    }

    case 'card.move': {
      const to = state.columns[op.toColumnId]
      if (!state.cards[op.cardId] || !to) return state
      const index = anchorToIndex(to.cardIds, op.cardId, op.afterCardId)
      const next = moveCardInState(
        state,
        op.cardId,
        op.toColumnId,
        index,
        op.at,
      )
      return next ? { ...state, ...next } : state
    }

    case 'card.delete': {
      const card = state.cards[op.cardId]
      if (!card) return state
      const column = state.columns[card.columnId]
      return {
        ...state,
        cards: withoutKey(state.cards, op.cardId),
        columns: column
          ? {
              ...state.columns,
              [column.id]: {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== op.cardId),
              },
            }
          : state.columns,
      }
    }
  }
}
