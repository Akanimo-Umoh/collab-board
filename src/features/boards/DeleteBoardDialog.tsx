import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDomainStore } from '@/store/domain/domainStore'
import { useBoard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'

interface DeleteBoardDialogProps {
  onDeleted: (title: string) => void
}

export function DeleteBoardDialog({ onDeleted }: DeleteBoardDialogProps) {
  const pendingDelete = useUIStore((s) => s.pendingDelete)
  const cancelDelete = useUIStore((s) => s.cancelDelete)
  const deleteBoard = useDomainStore((s) => s.deleteBoard)
  const board = useBoard(
    pendingDelete?.type === 'board' ? pendingDelete.id : '',
  )

  if (!pendingDelete || pendingDelete.type !== 'board' || !board) return null

  function handleConfirm() {
    // `board` is non-null here: we returned above otherwise.
    onDeleted(board.title)
    deleteBoard(board.id)
    cancelDelete()
  }

  return (
    <ConfirmDialog
      title="Delete this board?"
      message={`"${board.title}" and all of its columns and cards will be permanently deleted. This can't be undone.`}
      confirmLabel="Delete board"
      onConfirm={handleConfirm}
      onCancel={cancelDelete}
    />
  )
}
