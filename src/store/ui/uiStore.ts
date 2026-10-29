import { create } from 'zustand'
import type { ID } from '@/types/domain'
import type { CardPosition } from '@/lib/ordering'

export type CardModalState =
  { mode: 'create'; columnId: ID } | { mode: 'edit'; cardId: ID } | null

export type PendingDelete = { type: 'board' | 'column' | 'card'; id: ID } | null

/** 'disabled' means local-only mode (no realtime server configured). */
export type ConnectionState = 'disabled' | 'offline' | 'connecting' | 'online'

export interface DragPreviewGeometry {
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface DragState {
  cardId: ID
  mode: 'pointer' | 'keyboard'
  /** Where the card was when the drag began (used for cancel and rollback). */
  origin: CardPosition
  /** Pointer mode only: where it would land if dropped now. */
  over: CardPosition | null
  /** Pointer mode only: geometry for the floating preview. */
  preview: DragPreviewGeometry | null
}

interface UIStore {
  cardModal: CardModalState
  editingColumnId: ID | null
  pendingDelete: PendingDelete
  drag: DragState | null
  dragAnnouncement: string
  connection: ConnectionState
  initialSync: 'pending' | 'done'

  openCreateCard: (columnId: ID) => void
  openEditCard: (cardId: ID) => void
  closeCardModal: () => void

  startEditingColumn: (id: ID) => void
  stopEditingColumn: () => void

  requestDelete: (target: NonNullable<PendingDelete>) => void
  cancelDelete: () => void

  startDrag: (drag: DragState) => void
  setDragOver: (over: CardPosition | null) => void
  endDrag: () => void
  announceDrag: (message: string) => void

  setConnection: (connection: ConnectionState) => void
  finishInitialSync: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  cardModal: null,
  editingColumnId: null,
  pendingDelete: null,
  drag: null,
  dragAnnouncement: '',
  connection: 'disabled',
  initialSync: 'pending',

  openCreateCard: (columnId) =>
    set({ cardModal: { mode: 'create', columnId } }),
  openEditCard: (cardId) => set({ cardModal: { mode: 'edit', cardId } }),
  closeCardModal: () => set({ cardModal: null }),

  startEditingColumn: (id) => set({ editingColumnId: id }),
  stopEditingColumn: () => set({ editingColumnId: null }),

  requestDelete: (target) => set({ pendingDelete: target }),
  cancelDelete: () => set({ pendingDelete: null }),

  startDrag: (drag) => set({ drag }),
  // Returns the same state when the target did not change, so pointer moves inside the same slot notify nobody.
  setDragOver: (over) =>
    set((s) => {
      const drag = s.drag
      if (!drag) return s
      const current = drag.over
      if (
        current?.columnId === over?.columnId &&
        current?.index === over?.index
      ) {
        return s
      }
      return { drag: { ...drag, over } }
    }),
  endDrag: () => set({ drag: null }),
  announceDrag: (message) => set({ dragAnnouncement: message }),

  setConnection: (connection) => set({ connection }),
  finishInitialSync: () => set({ initialSync: 'done' }),
}))
