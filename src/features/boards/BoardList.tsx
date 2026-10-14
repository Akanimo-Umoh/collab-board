import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/ui/icons'
import { useBoardOrder } from '@/store/hooks'
import { BoardCard } from './BoardCard'

interface BoardListProps {
  onCreate: () => void
}

export function BoardList({ onCreate }: BoardListProps) {
  const boardOrder = useBoardOrder()

  if (boardOrder.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-ink">No boards yet</h2>
        <p className="max-w-sm text-sm text-ink-muted">
          Boards keep your ideas, docs, and tasks in one place. Create your
          first one to get started.
        </p>
        <Button onClick={onCreate} className="mt-2">
          <PlusIcon width={16} height={16} />
          Create board
        </Button>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boardOrder.map((id) => (
        <BoardCard key={id} id={id} />
      ))}
    </ul>
  )
}
