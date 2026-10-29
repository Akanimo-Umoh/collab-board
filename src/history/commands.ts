import { createId } from '@/lib/id'
import { quoted } from '@/realtime/describe'
import {
  indexToAnchor,
  type CardPatch,
  type DomainSnapshot,
  type Operation,
  type OperationInput,
} from '@/realtime/operations'
import type { CardComment, ID } from '@/types/domain'

/** One undoable user action: how to redo it, and how to reverse it. */
export interface HistoryEntry {
  id: string
  /** Shown in toasts and on the Undo / Redo buttons, e.g. Delete card “Fix login”. */
  label: string
  forward: OperationInput[]
  inverse: OperationInput[]
}

const entry = (
  label: string,
  forward: OperationInput[],
  inverse: OperationInput[],
): HistoryEntry => ({ id: createId(), label, forward, inverse })

/** Every comment under a card, parents before replies (so they can be re-added in order). */
export function collectCardComments(
  state: DomainSnapshot,
  cardId: ID,
): CardComment[] {
  const result: CardComment[] = []
  const queue: ID[] = [cardId]
  for (let i = 0; i < queue.length; i += 1) {
    for (const childId of state.commentChildren[queue[i]] ?? []) {
      const comment = state.comments[childId]
      if (!comment) continue
      result.push(comment)
      queue.push(childId)
    }
  }
  return result
}

/**
 * Builds the history entry for an operation the local user just performed, or null if it is not undoable. `before` is the state the operation replaced:
 * everything needed to reverse it is read from there, so the cost is
 * proportional to the change and never to the size of the board.
 */
export function createHistoryEntry(
  op: Operation,
  before: DomainSnapshot,
): HistoryEntry | null {
  switch (op.type) {
    case 'card.create':
      return entry(
        `Create card ${quoted(op.card.title)}`,
        [{ type: 'card.create', card: op.card }],
        [{ type: 'card.delete', cardId: op.card.id }],
      )

    case 'card.delete': {
      const card = before.cards[op.cardId]
      if (!card) return null
      const column = before.columns[card.columnId]
      if (!column) return null

      const index = column.cardIds.indexOf(card.id)
      const inverse: OperationInput[] = [{ type: 'card.create', card }]
      // card.create appends; only move it back if it was not the last card.
      if (index !== column.cardIds.length - 1) {
        inverse.push({
          type: 'card.move',
          cardId: card.id,
          toColumnId: column.id,
          afterCardId: indexToAnchor(column.cardIds, card.id, index),
        })
      }
      // Deleting a card deleted its comments too; bring them back.
      for (const comment of collectCardComments(before, card.id)) {
        inverse.push({ type: 'comment.add', comment })
      }

      return entry(
        `Delete card ${quoted(card.title)}`,
        [{ type: 'card.delete', cardId: op.cardId }],
        inverse,
      )
    }

    case 'card.move': {
      const card = before.cards[op.cardId]
      if (!card) return null
      const from = before.columns[card.columnId]
      if (!from) return null

      const index = from.cardIds.indexOf(card.id)
      return entry(
        `Move card ${quoted(card.title)}`,
        [
          {
            type: 'card.move',
            cardId: op.cardId,
            toColumnId: op.toColumnId,
            afterCardId: op.afterCardId,
          },
        ],
        [
          {
            type: 'card.move',
            cardId: op.cardId,
            toColumnId: from.id,
            afterCardId: indexToAnchor(from.cardIds, card.id, index),
          },
        ],
      )
    }

    case 'card.update': {
      const card = before.cards[op.cardId]
      if (!card) return null

      // Restore only the fields this edit touched, so a teammate's edit to another field is left alone.
      const previous: CardPatch = {}
      if (op.patch.title !== undefined) previous.title = card.title
      if (op.patch.description !== undefined) {
        previous.description = card.description
      }
      if (op.patch.tags !== undefined) previous.tags = card.tags
      if (op.patch.dueDate !== undefined) previous.dueDate = card.dueDate

      return entry(
        `Edit card ${quoted(card.title)}`,
        [{ type: 'card.update', cardId: op.cardId, patch: op.patch }],
        [{ type: 'card.update', cardId: op.cardId, patch: previous }],
      )
    }

    default:
      return null // boards, columns and comments are not undoable yet
  }
}
