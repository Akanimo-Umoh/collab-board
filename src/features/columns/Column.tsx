import { memo } from 'react'
import { useColumn } from '@/store/hooks'
import { ColumnHeader } from './ColumnHeader'
import { CardItem } from '../cards/CardItem'
import { AddCardButton } from '../cards/AddCardButton'

interface ColumnProps {
  id: string
}

export const Column = memo(function Column({ id }: ColumnProps) {
  const column = useColumn(id)

  if (!column) return null

  return (
    <li className="w-72 shrink-0">
      <section
        aria-label={column.title}
        className="flex flex-col rounded-card border border-border bg-surface-muted/60"
      >
        <ColumnHeader id={id} />

        <div className="flex flex-col gap-2 px-3 pb-3">
          {column.cardIds.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {column.cardIds.map((cardId) => (
                <CardItem key={cardId} id={cardId} />
              ))}
            </ul>
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
