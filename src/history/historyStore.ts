import { create } from 'zustand'
import { useDomainStore } from '@/store/domain/domainStore'
import { toast } from '@/store/ui/toastStore'
import type { OperationInput } from '@/realtime/operations'
import type { HistoryEntry } from './commands'

const MAX_HISTORY = 100

/**
 * True while undo/redo is dispatching its own operations, so the recorder and
 * the "created / deleted" toasts ignore them (otherwise undoing would record itself).
 */
let replaying = false
export const isReplayingHistory = () => replaying

function run(inputs: OperationInput[]): boolean {
  replaying = true
  try {
    return useDomainStore.getState().applyOperations(inputs)
  } finally {
    replaying = false
  }
}

interface HistoryStore {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  record: (entry: HistoryEntry) => void
  undo: () => void
  redo: () => void
  /** Undo a specific entry, but only if it is still the latest action. */
  undoEntry: (id: string) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  undoStack: [],
  redoStack: [],

  record: (entry) =>
    set((s) => ({
      undoStack: [...s.undoStack, entry].slice(-MAX_HISTORY),
      redoStack: [], // a new action makes the undone future unreachable
    })),

  undo: () => {
    const entry = get().undoStack.at(-1)
    if (!entry) return

    const applied = run(entry.inverse)
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      // If nothing changed (someone else got there first), the entry is simply dropped.
      redoStack: applied ? [...s.redoStack, entry] : s.redoStack,
    }))

    if (applied) {
      toast.info(`Undid: ${entry.label}.`, {
        action: { label: 'Redo', onAction: () => get().redo() },
      })
    } else {
      toast.error(
        `Couldn’t undo: ${entry.label}. Someone else may have changed it.`,
      )
    }
  },

  redo: () => {
    const entry = get().redoStack.at(-1)
    if (!entry) return

    const applied = run(entry.forward)
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: applied ? [...s.undoStack, entry] : s.undoStack,
    }))

    if (applied) {
      toast.info(`Redid: ${entry.label}.`)
    } else {
      toast.error(
        `Couldn’t redo: ${entry.label}. Someone else may have changed it.`,
      )
    }
  },

  undoEntry: (id) => {
    if (get().undoStack.at(-1)?.id === id) {
      get().undo()
    } else {
      toast.info(
        'Other changes were made since. Use Undo to step back one at a time.',
      )
    }
  },

  clear: () => set({ undoStack: [], redoStack: [] }),
}))
