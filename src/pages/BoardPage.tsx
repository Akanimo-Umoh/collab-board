import { Link, useParams } from 'react-router-dom'
import { useBoard } from '@/store/hooks'
import NotFoundPage from './NotFoundPage'
import { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/store/ui/uiStore'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { Column } from '@/features/columns/Column'
import { AddColumnForm } from '@/features/columns/AddColumnForm'
import { DeleteColumnDialog } from '@/features/columns/DeleteColumnDialog'

export default function BoardPage() {
  const { boardId = '' } = useParams()
  const board = useBoard(boardId)
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Leaving the page must not leave a half-open edit or delete prompt behind.
  useEffect(() => {
    return () => {
      const ui = useUIStore.getState()
      ui.stopEditingColumn()
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

  // The deleted column's button is gone, so send focus somewhere stable.
  function handleColumnDeleted(title: string) {
    setAnnouncement(`Column ${title} deleted.`)
    headingRef.current?.focus()
  }

  return (
    <div className="px-6 py-8">
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
          className="text-2xl font-semibold tracking-tight break-words text-ink focus:outline-none"
        >
          {board.title}
        </h1>
        {board.description && (
          <p className="mt-1 text-sm break-words text-ink-muted">
            {board.description}
          </p>
        )}
      </div>

      <div className="-mx-6 flex items-start gap-4 overflow-x-auto px-6 pb-6">
        <ul className="flex items-start gap-4">
          {board.columnIds.map((id) => (
            <Column key={id} id={id} />
          ))}
        </ul>

        <div className="w-72 shrink-0">
          <AddColumnForm
            boardId={board.id}
            columnCount={board.columnIds.length}
            onAdded={(title) => setAnnouncement(`Column ${title} added.`)}
          />
        </div>
      </div>

      <DeleteColumnDialog onDeleted={handleColumnDeleted} />

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
