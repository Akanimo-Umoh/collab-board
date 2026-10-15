import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDomainStore } from '@/store/domain/domainStore'
import { useColumn } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'

interface DeleteColumnDialogProps {
  onDeleted: (title: string) => void
}

export function DeleteColumnDialog({ onDeleted }: DeleteColumnDialogProps) {
  const pendingDelete = useUIStore((s) => s.pendingDelete)
  const cancelDelete = useUIStore((s) => s.cancelDelete)
  const deleteColumn = useDomainStore((s) => s.deleteColumn)
  const column = useColumn(
    pendingDelete?.type === 'column' ? pendingDelete.id : '',
  )

  if (!pendingDelete || pendingDelete.type !== 'column' || !column) return null

  const cardCount = column.cardIds.length
  const consequence =
    cardCount === 0
      ? `"${column.title}" will be permanently deleted.`
      : `"${column.title}" and its ${cardCount} ${cardCount === 1 ? 'card' : 'cards'} will be permanently deleted.`

  const handleConfirm = () => {
    onDeleted(column.title)
    deleteColumn(column.id)
    cancelDelete()
  }

  return (
    <ConfirmDialog
      title="Delete this column?"
      message={`${consequence} This can't be undone.`}
      confirmLabel="Delete column"
      onConfirm={handleConfirm}
      onCancel={cancelDelete}
    />
  )
}
 