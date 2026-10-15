import { Modal } from '@/components/ui/Modal'
import { useDomainStore } from '@/store/domain/domainStore'
import { useColumn } from '@/store/hooks'
import type { CardInput } from '@/types/domain'
import { CardForm } from './CardForm'

interface CreateCardModalProps {
  columnId: string
  onClose: () => void
  onAnnounce: (message: string) => void
}

export function CreateCardModal({
  columnId,
  onClose,
  onAnnounce,
}: CreateCardModalProps) {
  const column = useColumn(columnId)
  const addCard = useDomainStore((s) => s.addCard)

  if (!column) return null

  const handleSubmit = (input: CardInput) => {
    addCard(columnId, input)
    onAnnounce(`Card ${input.title} added to ${column.title}.`)
    onClose()
  }

  return (
    <Modal
      title="New card"
      description={`Add a card to ${column.title}.`}
      onClose={onClose}
      size="lg"
    >
      <CardForm
        submitLabel="Create card"
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
