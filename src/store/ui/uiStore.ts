import { create } from 'zustand'
import type { ID } from '@/types/domain'

export type CardModalState =
  { mode: 'create'; columnId: ID } | { mode: 'edit'; cardId: ID } | null

export type PendingDelete = { type: 'board' | 'column' | 'card'; id: ID } | null

interface UIStore {
  cardModal: CardModalState
  editingColumnId: ID | null
  pendingDelete: PendingDelete

  openCreateCard: (columnId: ID) => void
  openEditCard: (cardId: ID) => void
  closeCardModal: () => void

  startEditingColumn: (id: ID) => void
  stopEditingColumn: () => void

  requestDelete: (target: NonNullable<PendingDelete>) => void
  cancelDelete: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  cardModal: null,
  editingColumnId: null,
  pendingDelete: null,

  openCreateCard: (columnId) =>
    set({ cardModal: { mode: 'create', columnId } }),
  openEditCard: (cardId) => set({ cardModal: { mode: 'edit', cardId } }),
  closeCardModal: () => set({ cardModal: null }),

  startEditingColumn: (id) => set({ editingColumnId: id }),
  stopEditingColumn: () => set({ editingColumnId: null }),

  requestDelete: (target) => set({ pendingDelete: target }),
  cancelDelete: () => set({ pendingDelete: null }),
}))
