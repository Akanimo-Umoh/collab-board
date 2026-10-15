import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { AddColumnForm } from '@/features/columns/AddColumnForm'
import { Column } from '@/features/columns/Column'
import { DeleteColumnDialog } from '@/features/columns/DeleteColumnDialog'
import { useBoard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import NotFoundPage from './NotFoundPage'
import { CardModalHost } from '@/features/cards/CardModalHost'
import { DeleteCardDialog } from '@/features/cards/DeleteCardDialog'

export default function BoardPage() {
  const { boardId = '' } = useParams()
  const board = useBoard(boardId)
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Leaving the page must not leave a half-open edit, dialog, or delete prompt behind.
  useEffect(() => {
    return () => {
      const ui = useUIStore.getState()
      ui.stopEditingColumn()
      ui.closeCardModal()
      ui.cancelDelete()
    }
  }, [])

  if (!board) {
    return (
      <NotFoundPage
        heading="Board not found"
        message="This board doesn't exist or may have been deleted."
      />
    )
  }

  // A deleted item's trigger is gone, so send focus somewhere stable.
  function handleDeleted(kind: 'Column' | 'Card', title: string) {
    setAnnouncement(`${kind} ${title} deleted.`)
    headingRef.current?.focus()
  }

  return (
    <div className="py-8">
      {/* Same content column as the header and dashboard */}
      <div className="mx-auto w-full max-w-6xl px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon width={16} height={16} />
          All boards
        </Link>

        <div className="mt-4 mb-6 max-w-2xl">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight wrap-break-word text-ink focus:outline-none"
          >
            {board.title}
          </h1>
          {board.description && (
            <p className="mt-1 text-sm wrap-break-word text-ink-muted">
              {board.description}
            </p>
          )}
        </div>
      </div>

      {/* Full-width scroller whose first column lines up with the title above */}
      <div className="flex items-start gap-4 overflow-x-auto board-gutter pb-6">
        {/* Skipped when empty: an empty list would still claim a flex gap and a screen reader stop */}
        {board.columnIds.length > 0 && (
          <ul className="flex items-start gap-4">
            {board.columnIds.map((id) => (
              <Column key={id} id={id} />
            ))}
          </ul>
        )}

        <div className="w-72 shrink-0">
          <AddColumnForm
            boardId={board.id}
            columnCount={board.columnIds.length}
            onAdded={(title) => setAnnouncement(`Column ${title} added.`)}
          />
        </div>
      </div>

      <CardModalHost onAnnounce={setAnnouncement} />
      <DeleteColumnDialog
        onDeleted={(title) => handleDeleted('Column', title)}
      />
      <DeleteCardDialog onDeleted={(title) => handleDeleted('Card', title)} />

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
