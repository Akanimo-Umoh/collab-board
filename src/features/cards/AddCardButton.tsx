import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/ui/icons'
import { useUIStore } from '@/store/ui/uiStore'

interface AddCardButtonProps {
  columnId: string
  columnTitle: string
}

export function AddCardButton({ columnId, columnTitle }: AddCardButtonProps) {
  const openCreateCard = useUIStore((s) => s.openCreateCard)

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Add card to ${columnTitle}`}
      className="w-full justify-start"
      onClick={() => openCreateCard(columnId)}
    >
      <PlusIcon width={16} height={16} />
      Add card
    </Button>
  )
}
