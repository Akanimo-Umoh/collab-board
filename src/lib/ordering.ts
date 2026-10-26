import type { Board, Card, Column, ID } from '@/types/domain'

export interface CardPosition {
  columnId: ID
  /** Index inside the column's cardIds. */
  index: number
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right'

interface CardEntities {
  columns: Record<ID, Column>
  cards: Record<ID, Card>
}

interface BoardEntities extends CardEntities {
  boards: Record<ID, Board>
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

/**
 * Pure move. `toIndex` is the card's FINAL index in the destination column, i.e. the index among the destination's other cards.
 * Returns null when nothing would change, so callers can keep the same state reference (Zustand then skips notifying subscribers).
 */

export function moveCardInState(
  state: CardEntities,
  cardId: ID,
  toColumnId: ID,
  toIndex: number,
  now: string,
): CardEntities | null {
  const card = state.cards[cardId]
  if (!card) return null
  const from = state.columns[card.columnId]
  const to = state.columns[toColumnId]
  if (!from || !to) return null

  const fromIndex = from.cardIds.indexOf(cardId)
  if (fromIndex === -1) return null

  const remaining = from.cardIds.filter((id) => id !== cardId)

  // Reorder inside one column: only that column's cardIds changes.
  if (from.id === to.id) {
    const index = clamp(toIndex, 0, remaining.length)
    if (index === fromIndex) return null
    const cardIds = [
      ...remaining.slice(0, index),
      cardId,
      ...remaining.slice(index),
    ]
    return {
      columns: { ...state.columns, [from.id]: { ...from, cardIds } },
      cards: state.cards,
    }
  }

  // Move across columns: both columns and the card's parent pointer change.
  const index = clamp(toIndex, 0, to.cardIds.length)
  const targetIds = [
    ...to.cardIds.slice(0, index),
    cardId,
    ...to.cardIds.slice(index),
  ]
  return {
    columns: {
      ...state.columns,
      [from.id]: { ...from, cardIds: remaining },
      [to.id]: { ...to, cardIds: targetIds },
    },
    cards: {
      ...state.cards,
      [cardId]: { ...card, columnId: to.id, updatedAt: now },
    },
  }
}

/** Where an arrow key would put the card, or null at an edge. */
export function getKeyboardTarget(
  state: BoardEntities,
  cardId: ID,
  direction: MoveDirection,
): CardPosition | null {
  const card = state.cards[cardId]
  if (!card) return null
  const column = state.columns[card.columnId]
  if (!column) return null

  const index = column.cardIds.indexOf(cardId)
  if (index === -1) return null

  switch (direction) {
    case 'up':
      return index > 0 ? { columnId: column.id, index: index - 1 } : null
    case 'down':
      return index < column.cardIds.length - 1
        ? { columnId: column.id, index: index + 1 }
        : null
    case 'left':
    case 'right': {
      const board = state.boards[column.boardId]
      if (!board) return null
      const at = board.columnIds.indexOf(column.id)
      const targetId = board.columnIds[at + (direction === 'left' ? -1 : 1)]
      if (!targetId) return null
      const target = state.columns[targetId]
      if (!target) return null
      return {
        columnId: targetId,
        index: Math.min(index, target.cardIds.length),
      }
    }
  }
}
