import { memo } from 'react'
import { Link } from 'react-router-dom'
import { IconButton } from '@/components/ui/IconButton'
import { TrashIcon } from '@/components/ui/icons'
import { formatDate } from '@/lib/date'
import { useBoard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'

interface BoardCardProps {
  id: string
}

export const BoardCard = memo(function BoardCard({ id }: BoardCardProps) {
  const board = useBoard(id)
  const requestDelete = useUIStore((s) => s.requestDelete)

  if (!board) return null

  return (
    <li className="relative flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-ink-muted/40">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-base font-semibold text-ink">
          <Link
            to={`/boards/${board.id}`}
            className="rounded-sm after:absolute after:inset-0 after:rounded-card"
          >
            <span className="line-clamp-2 wrap-break-word">{board.title}</span>
          </Link>
        </h2>

        <IconButton
          label={`Delete board ${board.title}`}
          className="relative z-10 -mt-1 -mr-2"
          onClick={() => requestDelete({ type: 'board', id: board.id })}
        >
          <TrashIcon />
        </IconButton>
      </div>

      {board.description ? (
        <p className="line-clamp-2 text-sm wrap-break-word text-ink-muted">
          {board.description}
        </p>
      ) : (
        <p className="text-sm text-ink-muted/70 italic">No description</p>
      )}

      <p className="mt-auto pt-1 text-xs text-ink-muted">
        Created{' '}
        <time dateTime={board.createdAt}>{formatDate(board.createdAt)}</time>
      </p>
    </li>
  )
})
