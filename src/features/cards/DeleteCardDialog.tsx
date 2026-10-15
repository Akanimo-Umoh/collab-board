import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDomainStore } from '@/store/domain/domainStore'
import { useCard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'

interface DeleteCardDialogProps {
  onDeleted: (title: string) => void
}

export function DeleteCardDialog({ onDeleted }: DeleteCardDialogProps) {
  const pendingDelete = useUIStore((s) => s.pendingDelete)
  const cancelDelete = useUIStore((s) => s.cancelDelete)
  const closeCardModal = useUIStore((s) => s.closeCardModal)
  const deleteCard = useDomainStore((s) => s.deleteCard)
  const card = useCard(pendingDelete?.type === 'card' ? pendingDelete.id : '')

  if (!pendingDelete || pendingDelete.type !== 'card' || !card) return null

  const handleConfirm = () => {
    onDeleted(card.title)
    deleteCard(card.id)
    closeCardModal()
    cancelDelete()
  }

  return (
    <ConfirmDialog
      title="Delete this card?"
      message={`"${card.title}" will be permanently deleted. This can't be undone.`}
      confirmLabel="Delete card"
      onConfirm={handleConfirm}
      onCancel={cancelDelete}
    />
  )
}
