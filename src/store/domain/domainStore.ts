import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/id'
import { withoutKey } from '@/lib/records'
import type {
  Board,
  BoardInput,
  Card,
  CardInput,
  Column,
  ID,
} from '@/types/domain'

interface DomainState {
  boardOrder: ID[]
  boards: Record<ID, Board>
  columns: Record<ID, Column>
  cards: Record<ID, Card>
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
}

export type DomainStore = DomainState & DomainActions

const initialState: DomainState = {
  boardOrder: [],
  boards: {},
  columns: {},
  cards: {},
}

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get) => ({
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
        set((s) => ({
          boards: { ...s.boards, [id]: board },
          boardOrder: [id, ...s.boardOrder], // newest first
        }))
        return id
      },

      deleteBoard: (id) =>
        set((s) => {
          const board = s.boards[id]
          if (!board) return s

          const columns = { ...s.columns }
          const cards = { ...s.cards }
          for (const columnId of board.columnIds) {
            s.columns[columnId]?.cardIds.forEach(
              (cardId) => delete cards[cardId],
            )
            delete columns[columnId]
          }

          return {
            boards: withoutKey(s.boards, id),
            boardOrder: s.boardOrder.filter((b) => b !== id),
            columns,
            cards,
          }
        }),

      /* ---------- columns ---------- */
      addColumn: (boardId, title) => {
        if (!get().boards[boardId]) return null
        const id = createId()
        set((s) => {
          const board = s.boards[boardId]
          return {
            columns: {
              ...s.columns,
              [id]: { id, boardId, title: title.trim(), cardIds: [] },
            },
            boards: {
              ...s.boards,
              [boardId]: { ...board, columnIds: [...board.columnIds, id] },
            },
          }
        })
        return id
      },

      renameColumn: (id, title) =>
        set((s) => {
          const column = s.columns[id]
          if (!column) return s
          return {
            columns: { ...s.columns, [id]: { ...column, title: title.trim() } },
          }
        }),

      deleteColumn: (id) =>
        set((s) => {
          const column = s.columns[id]
          if (!column) return s

          const cards = { ...s.cards }
          column.cardIds.forEach((cardId) => delete cards[cardId])

          const board = s.boards[column.boardId]
          return {
            columns: withoutKey(s.columns, id),
            cards,
            boards: {
              ...s.boards,
              [board.id]: {
                ...board,
                columnIds: board.columnIds.filter((c) => c !== id),
              },
            },
          }
        }),

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
        set((s) => {
          const column = s.columns[columnId]
          return {
            cards: { ...s.cards, [id]: card },
            columns: {
              ...s.columns,
              [columnId]: { ...column, cardIds: [...column.cardIds, id] },
            },
          }
        })
        return id
      },

      updateCard: (id, patch) =>
        set((s) => {
          const card = s.cards[id]
          if (!card) return s
          return {
            cards: {
              ...s.cards,
              [id]: { ...card, ...patch, updatedAt: new Date().toISOString() },
            },
          }
        }),

      deleteCard: (id) =>
        set((s) => {
          const card = s.cards[id]
          if (!card) return s
          const column = s.columns[card.columnId]
          return {
            cards: withoutKey(s.cards, id),
            columns: {
              ...s.columns,
              [column.id]: {
                ...column,
                cardIds: column.cardIds.filter((c) => c !== id),
              },
            },
          }
        }),
    }),
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
