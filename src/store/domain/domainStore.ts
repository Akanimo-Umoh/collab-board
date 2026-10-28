import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/id'
import type {
  Board,
  BoardInput,
  Card,
  CardInput,
  Column,
  ID,
} from '@/types/domain'
import {
  applyOperation,
  createOperation,
  diffCardPatch,
  indexToAnchor,
  type DomainSnapshot,
  type Operation,
} from '@/realtime/operations'

type DomainState = DomainSnapshot

interface MoveOptions {
  /** Apply on this device only: never sent to other sessions. Used for keyboard drag previews. */
  local?: boolean
}

interface DomainActions {
  createBoard: (input: BoardInput) => ID
  deleteBoard: (id: ID) => void

  addColumn: (boardId: ID, title: string) => ID | null
  renameColumn: (id: ID, title: string) => void
  deleteColumn: (id: ID) => void

  addCard: (columnId: ID, input: CardInput) => ID | null
  updateCard: (id: ID, patch: Partial<CardInput>) => void
  deleteCard: (id: ID) => void

  /** `toIndex` is the final index among the destination's other cards. False if nothing changed. */
  moveCard: (
    cardId: ID,
    toColumnId: ID,
    toIndex: number,
    options?: MoveOptions,
  ) => boolean
}

export type DomainStore = DomainState & DomainActions

const initialState: DomainState = {
  boardOrder: [],
  boards: {},
  columns: {},
  cards: {},
}

/* Hook for the sync engine: hears every operation the local user performs. */
type LocalOperationListener = (op: Operation) => void
const localOperationListeners = new Set<LocalOperationListener>()

export function onLocalOperation(listener: LocalOperationListener): () => void {
  localOperationListeners.add(listener)
  return () => {
    localOperationListeners.delete(listener)
  }
}

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get) => {
      /** Applies an operation optimistically. Returns false when it changed nothing. */
      const dispatch = (op: Operation, { notify = true } = {}): boolean => {
        let changed = false
        set((s) => {
          const next = applyOperation(s, op)
          if (next === s) return s // same reference: no subscriber is notified
          changed = true
          return next
        })
        if (changed && notify) {
          localOperationListeners.forEach((listener) => listener(op))
        }
        return changed
      }

      return {
        ...initialState,

        /* ---------- boards ---------- */
        createBoard: ({ title, description }) => {
          const id = createId()
          const board: Board = {
            id,
            title: title.trim(),
            description: description.trim(),
            createdAt: new Date().toISOString(),
            columnIds: [],
          }
          dispatch(createOperation({ type: 'board.create', board }))
          return id
        },

        deleteBoard: (id) =>
          void dispatch(createOperation({ type: 'board.delete', boardId: id })),

        /* ---------- columns ---------- */
        addColumn: (boardId, title) => {
          if (!get().boards[boardId]) return null
          const id = createId()
          const column: Column = {
            id,
            boardId,
            title: title.trim(),
            cardIds: [],
          }
          dispatch(createOperation({ type: 'column.add', column }))
          return id
        },

        renameColumn: (id, title) =>
          void dispatch(
            createOperation({
              type: 'column.rename',
              columnId: id,
              title: title.trim(),
            }),
          ),

        deleteColumn: (id) =>
          void dispatch(
            createOperation({ type: 'column.delete', columnId: id }),
          ),

        /* ---------- cards ---------- */
        addCard: (columnId, input) => {
          if (!get().columns[columnId]) return null
          const id = createId()
          const now = new Date().toISOString()
          const card: Card = {
            id,
            columnId,
            title: input.title.trim(),
            description: input.description,
            tags: input.tags,
            dueDate: input.dueDate,
            createdAt: now,
            updatedAt: now,
          }
          dispatch(createOperation({ type: 'card.create', card }))
          return id
        },

        updateCard: (id, patch) => {
          const card = get().cards[id]
          if (!card) return
          // Send only what really changed, so concurrent edits to other fields survive.
          const changes = diffCardPatch(card, patch)
          if (!changes) return
          dispatch(
            createOperation({
              type: 'card.update',
              cardId: id,
              patch: changes,
            }),
          )
        },

        deleteCard: (id) =>
          void dispatch(createOperation({ type: 'card.delete', cardId: id })),

        moveCard: (cardId, toColumnId, toIndex, options) => {
          const { cards, columns } = get()
          const to = columns[toColumnId]
          if (!cards[cardId] || !to) return false
          return dispatch(
            createOperation({
              type: 'card.move',
              cardId,
              toColumnId,
              afterCardId: indexToAnchor(to.cardIds, cardId, toIndex),
            }),
            { notify: !options?.local },
          )
        },
      }
    },
    {
      name: 'collabboard:domain',
      partialize: ({ boardOrder, boards, columns, cards }) => ({
        boardOrder,
        boards,
        columns,
        cards,
      }),
    },
  ),
)
