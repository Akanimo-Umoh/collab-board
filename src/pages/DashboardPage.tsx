import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/ui/icons'
import { BoardList } from '@/features/boards/BoardList'
import { CreateBoardDialog } from '@/features/boards/CreateBoardDialog'
import { DeleteBoardDialog } from '@/features/boards/DeleteBoardDialog'

export default function DashboardPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // After a board disappears, its delete button is gone too, so send focus somewhere stable.
  function handleDeleted(title: string) {
    setAnnouncement(`Board ${title} deleted.`)
    headingRef.current?.focus()
  }

  function handleCreated(title: string) {
    setAnnouncement(`Board ${title} created.`)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-ink focus:outline-none"
          >
            Your boards
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Plan, organize, and track work across your boards.
          </p>
        </div>

        <Button onClick={() => setIsCreating(true)}>
          <PlusIcon width={16} height={16} />
          New board
        </Button>
      </div>

      <BoardList onCreate={() => setIsCreating(true)} />

      {isCreating && (
        <CreateBoardDialog
          onClose={() => setIsCreating(false)}
          onCreated={handleCreated}
        />
      )}
      <DeleteBoardDialog onDeleted={handleDeleted} />

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
