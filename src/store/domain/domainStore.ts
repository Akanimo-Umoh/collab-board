import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MAX_COMMENT_LENGTH } from '@/lib/comments'
import { createId } from '@/lib/id'
import { getIdentity } from '@/lib/identity'
import { createOperation } from '@/realtime/createOperation'
import {
  applyOperation,
  diffCardPatch,
  indexToAnchor,
  type DomainSnapshot,
  type Operation,
} from '@/realtime/operations'
import type {
  Board,
  BoardInput,
  Card,
  CardComment,
  CardInput,
  Column,
  ID,
} from '@/types/domain'

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

  /** `parentId` null adds a top-level comment. Returns the new id, or null if it was rejected. */
  addComment: (cardId: ID, parentId: ID | null, body: string) => ID | null
  editComment: (id: ID, body: string) => void
  deleteComment: (id: ID) => void
}

export type DomainStore = DomainState & DomainActions

const initialState: DomainState = {
  boardOrder: [],
  boards: {},
  columns: {},
  cards: {},
  comments: {},
  commentChildren: {},
}

/* Hook for the sync engine: hears every operation the local user performs. */
type LocalOperationListener = (op: Operation, before: DomainSnapshot) => void
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
        const before = get() // what this operation replaced: titles of deleted items, and later, undo
        let changed = false
        set((s) => {
          const next = applyOperation(s, op)
          if (next === s) return s // same reference: no subscriber is notified
          changed = true
          return next
        })
        if (changed && notify) {
          localOperationListeners.forEach((listener) => listener(op, before))
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

        /* ---------- comments ---------- */
        addComment: (cardId, parentId, body) => {
          const { cards, comments } = get()
          if (!cards[cardId]) return null
          if (parentId !== null) {
            const parent = comments[parentId]
            if (!parent || parent.cardId !== cardId) return null
          }
          const text = body.trim()
          if (!text || text.length > MAX_COMMENT_LENGTH) return null

          const author = getIdentity()
          const now = new Date().toISOString()
          const id = createId()
          const comment: CardComment = {
            id,
            cardId,
            parentId,
            authorId: author.id,
            authorName: author.name,
            body: text,
            createdAt: now,
            updatedAt: now,
            deleted: false,
          }
          dispatch(createOperation({ type: 'comment.add', comment }))
          return id
        },

        editComment: (id, body) => {
          const text = body.trim()
          if (!text || text.length > MAX_COMMENT_LENGTH) return
          dispatch(
            createOperation({
              type: 'comment.edit',
              commentId: id,
              body: text,
              authorId: getIdentity().id,
            }),
          )
        },

        deleteComment: (id) =>
          void dispatch(
            createOperation({
              type: 'comment.delete',
              commentId: id,
              authorId: getIdentity().id,
            }),
          ),
      }
    },
    {
      name: 'collabboard:domain',
      partialize: ({
        boardOrder,
        boards,
        columns,
        cards,
        comments,
        commentChildren,
      }) => ({ boardOrder, boards, columns, cards, comments, commentChildren }),
    },
  ),
)
