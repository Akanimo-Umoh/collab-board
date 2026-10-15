import { useUIStore } from '@/store/ui/uiStore'
import { CardDetailModal } from './CardDetailModal'
import { CreateCardModal } from './CreateCardModal'

interface CardModalHostProps {
  onAnnounce: (message: string) => void
}

export function CardModalHost({ onAnnounce }: CardModalHostProps) {
  const cardModal = useUIStore((s) => s.cardModal)
  const closeCardModal = useUIStore((s) => s.closeCardModal)

  if (!cardModal) return null

  if (cardModal.mode === 'create') {
    return (
      <CreateCardModal
        columnId={cardModal.columnId}
        onClose={closeCardModal}
        onAnnounce={onAnnounce}
      />
    )
  }

  return (
    <CardDetailModal
      cardId={cardModal.cardId}
      onClose={closeCardModal}
      onAnnounce={onAnnounce}
    />
  )
}
