import { memo } from 'react'
import { useColumn } from '@/store/hooks'
import { ColumnHeader } from './ColumnHeader'

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

        <div className="px-3 pb-3">
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-muted">
            No cards yet
          </p>
        </div>
      </section>
    </li>
  )
})
 