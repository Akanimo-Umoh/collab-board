import { memo } from 'react'
import { formatDueDate } from '@/lib/date'
import { useCard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import { TagList } from './TagList'

interface CardItemProps {
  id: string
}

export const CardItem = memo(function CardItem({ id }: CardItemProps) {
  const card = useCard(id)
  const openEditCard = useUIStore((s) => s.openEditCard)

  if (!card) return null

  return (
    <li>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => openEditCard(card.id)}
        className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left shadow-card transition-colors hover:border-ink-muted/40"
      >
        <span className="text-sm font-medium wrap-break-word text-ink">
          {card.title}
        </span>

        {card.tags.length > 0 && (
          <span className="flex flex-wrap">
            <span className="sr-only">Tags: </span>
            <TagList tags={card.tags} />
          </span>
        )}

        {card.dueDate && (
          <span className="text-xs text-ink-muted">
            Due{' '}
            <time dateTime={card.dueDate}>{formatDueDate(card.dueDate)}</time>
          </span>
        )}
      </button>
    </li>
  )
})
