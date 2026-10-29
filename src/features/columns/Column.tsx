import { memo, type CSSProperties, type ReactNode } from 'react'
import { useColumn } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import { ColumnHeader } from './ColumnHeader'
import { CardItem } from '../cards/CardItem'
import { AddCardButton } from '../cards/AddCardButton'

/** Each column takes the next hue in turn, so neighbours always look different. */
const COLUMN_HUES = [350, 24, 48, 142, 174, 210, 262, 300]

interface ColumnProps {
  id: string
  /** Position on the board: decides the column's colour. */
  index: number
}

/** A card-shaped ghost showing where the dragged card will land. */
function DropPlaceholder({ height }: { height: number }) {
  return (
    <li
      aria-hidden="true"
      style={{ height }}
      className="drop-placeholder rounded-lg motion-safe:transition-[height,opacity] motion-safe:duration-150 starting:h-0 starting:opacity-0"
    />
  )
}

export const Column = memo(function Column({ id, index }: ColumnProps) {
  const column = useColumn(id)

  // These selectors return primitives, and only the column being hovered gets
  // a value, so a drag re-renders the old and new target column, not the board.
  const dropIndex = useUIStore((s) => {
    const over = s.drag?.over
    return over && over.columnId === id ? over.index : -1
  })
  const draggedId = useUIStore((s) => {
    const drag = s.drag
    return drag && drag.over && drag.over.columnId === id ? drag.cardId : null
  })
  const placeholderHeight = useUIStore((s) => {
    const drag = s.drag
    return drag && drag.over && drag.over.columnId === id
      ? (drag.preview?.height ?? 72)
      : 0
  })

  if (!column) return null

  // dropIndex counts the OTHER cards, so the dragged card is skipped when counting.
  const items: ReactNode[] = []
  let others = 0
  for (const cardId of column.cardIds) {
    if (cardId !== draggedId) {
      if (others === dropIndex) {
        items.push(
          <DropPlaceholder key="drop-placeholder" height={placeholderHeight} />,
        )
      }
      others += 1
    }
    items.push(<CardItem key={cardId} id={cardId} />)
  }
  if (others === dropIndex) {
    items.push(
      <DropPlaceholder key="drop-placeholder" height={placeholderHeight} />,
    )
  }

  const style = {
    '--col-h': COLUMN_HUES[index % COLUMN_HUES.length],
  } as CSSProperties

  return (
    <li style={style} className="flex max-h-full w-72 shrink-0 flex-col">
      <section
        aria-label={column.title}
        data-drop-column={id}
        className="column-panel flex min-h-0 flex-col rounded-card"
      >
        <div className="shrink-0">
          <ColumnHeader id={id} />
        </div>

        {/* Only this list scrolls; the header and "Add card" stay in view. The side padding leaves room for card shadows and focus rings, which a scroll container would otherwise clip. */}
        <div
          data-column-scroll
          className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-1"
        >
          {items.length > 0 ? (
            <ul className="flex flex-col gap-2">{items}</ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-muted">
              No cards yet
            </p>
          )}
        </div>

        <div className="shrink-0 px-3 pt-2 pb-3">
          <AddCardButton columnId={id} columnTitle={column.title} />
        </div>
      </section>
    </li>
  )
})
