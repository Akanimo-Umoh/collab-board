import { memo, type ReactNode } from 'react'
import { useColumn } from '@/store/hooks'
import { ColumnHeader } from './ColumnHeader'
import { CardItem } from '../cards/CardItem'
import { AddCardButton } from '../cards/AddCardButton'
import { useUIStore } from '@/store/ui/uiStore'

interface ColumnProps {
  id: string
}

function DropIndicator() {
  return <li aria-hidden="true" className="h-1 rounded-full bg-ink-muted/60" />
}

export const Column = memo(function Column({ id }: ColumnProps) {
  const column = useColumn(id)

  // Both selectors return primitives, and only the column being hovered gets a value, so a drag re-renders the old and new target column, not the board.
  const dropIndex = useUIStore((s) => {
    const over = s.drag?.over
    return over && over.columnId === id ? over.index : -1
  })
  const draggedId = useUIStore((s) => {
    const drag = s.drag
    return drag && drag.over && drag.over.columnId === id ? drag.cardId : null
  })

  if (!column) return null

  // dropIndex counts the OTHER cards, so the dragged card is skipped when counting.
  const items: ReactNode[] = []
  let others = 0
  for (const cardId of column.cardIds) {
    if (cardId !== draggedId) {
      if (others === dropIndex)
        items.push(<DropIndicator key="drop-indicator" />)
      others += 1
    }
    items.push(<CardItem key={cardId} id={cardId} />)
  }
  if (others === dropIndex) items.push(<DropIndicator key="drop-indicator" />)

  return (
    <li className="w-72 shrink-0">
      <section
        aria-label={column.title}
        data-drop-column={id}
        className="flex flex-col rounded-card border border-border bg-surface-muted/60"
      >
        <ColumnHeader id={id} />

        <div className="flex flex-col gap-2 px-3 pb-3">
          {items.length > 0 ? (
            <ul className="flex flex-col gap-2">{items}</ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-muted">
              No cards yet
            </p>
          )}

          <AddCardButton columnId={id} columnTitle={column.title} />
        </div>
      </section>
    </li>
  )
})
