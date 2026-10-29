import { describeOperation } from '@/realtime/describe'
import { onLocalOperation } from '@/store/domain/domainStore'
import { toast } from '@/store/ui/toastStore'
import { createHistoryEntry } from './commands'
import { isReplayingHistory, useHistoryStore } from './historyStore'

/** Records undo entries for local actions and confirms them with a toast. */
export function startHistory(): () => void {
  return onLocalOperation((op, before) => {
    if (isReplayingHistory()) return // undo/redo announce themselves

    const entry = createHistoryEntry(op, before)
    if (entry) useHistoryStore.getState().record(entry)

    const message = describeOperation(op, before, 'local')
    if (!message) return

    if (entry && op.type === 'card.delete') {
      toast.success(message, {
        action: {
          label: 'Undo',
          onAction: () => useHistoryStore.getState().undoEntry(entry.id),
        },
      })
    } else {
      toast.success(message)
    }
  })
}
