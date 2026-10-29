// import { Suspense, lazy, useEffect, useRef, useState } from 'react'
// import { Link, useParams } from 'react-router-dom'
// import { ArrowLeftIcon } from '@/components/ui/icons'
// import { AddColumnForm } from '@/features/columns/AddColumnForm'
// import { Column } from '@/features/columns/Column'
// import { DeleteColumnDialog } from '@/features/columns/DeleteColumnDialog'
// import { DragAnnouncer } from '@/features/dnd/DragAnnouncer'
// import { DragPreview } from '@/features/dnd/DragPreview'
// import { cancelKeyboardDrag } from '@/features/dnd/keyboardDrag'
// import { cancelPointerDrag } from '@/features/dnd/pointerDrag'
// import { HistoryControls } from '@/features/history/HistoryControls'
// import { ConnectionStatus } from '@/features/realtime/ConnectionStatus'
// import { useHistoryShortcuts } from '@/history/useHistoryShortcuts'
// import { PerfProfiler } from '@/perf/PerfProfiler'
// import { isPerfLabEnabled } from '@/perf/perfStats'
// import { useBoard } from '@/store/hooks'
// import { useUIStore } from '@/store/ui/uiStore'
// import NotFoundPage from './NotFoundPage'
// import { CardModalHost } from '@/features/cards/CardModalHost'
// import { DeleteCardDialog } from '@/features/cards/DeleteCardDialog'

// // The lab is opt-in (?perf) and loaded on demand, so it costs normal users nothing.
// const PERF_LAB_ENABLED = isPerfLabEnabled()
// const PerfLab = lazy(() => import('@/perf/PerfLab'))

// export default function BoardPage() {
//   const { boardId = '' } = useParams()
//   const board = useBoard(boardId)
//   const [announcement, setAnnouncement] = useState('')
//   const headingRef = useRef<HTMLHeadingElement>(null)

//   useHistoryShortcuts(boardId)

//   // Leaving the page must not leave a half-open edit, dialog, delete prompt or drag behind.
//   useEffect(() => {
//     return () => {
//       const ui = useUIStore.getState()
//       ui.stopEditingColumn()
//       ui.closeCardModal()
//       ui.cancelDelete()
//       cancelPointerDrag()
//       if (ui.drag?.mode === 'keyboard') {
//         cancelKeyboardDrag(ui.drag.cardId, false)
//       }
//     }
//   }, [])

//   if (!board) {
//     return (
//       <NotFoundPage
//         heading="Board not found"
//         message="This board doesn't exist or may have been deleted."
//       />
//     )
//   }

//   // A deleted item's trigger is gone, so send focus somewhere stable.
//   function handleDeleted(kind: 'Column' | 'Card', title: string) {
//     setAnnouncement(`${kind} ${title} deleted.`)
//     headingRef.current?.focus()
//   }

//   return (
//     <div className="py-8">
//       {/* Same content column as the header and dashboard */}
//       <div className="mx-auto w-full max-w-6xl px-6">
//         <Link
//           to="/"
//           className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
//         >
//           <ArrowLeftIcon width={16} height={16} />
//           All boards
//         </Link>

//         <div className="mt-4 mb-6 flex items-start justify-between gap-4">
//           <div className="max-w-2xl min-w-0">
//             <h1
//               ref={headingRef}
//               tabIndex={-1}
//               className="text-2xl font-semibold tracking-tight wrap-break-word text-ink focus:outline-none"
//             >
//               {board.title}
//             </h1>
//             {board.description && (
//               <p className="mt-1 text-sm wrap-break-word text-ink-muted">
//                 {board.description}
//               </p>
//             )}
//           </div>
//           <HistoryControls />
//         </div>
//       </div>

//       {/* Full-width scroller whose first column lines up with the title above.
//       data-board-scroller lets a drag auto-scroll it horizontally. */}
//       <PerfProfiler id="board-columns">
//         <div
//           data-board-scroller
//           className="flex items-start gap-4 overflow-x-auto board-gutter pb-6"
//         >
//           {/* Skipped when empty: an empty list would still claim a flex gap and a screen reader stop */}
//           {board.columnIds.length > 0 && (
//             <ul className="flex items-start gap-4">
//               {board.columnIds.map((id) => (
//                 <Column key={id} id={id} />
//               ))}
//             </ul>
//           )}

//           <div className="w-72 shrink-0">
//             <AddColumnForm
//               boardId={board.id}
//               columnCount={board.columnIds.length}
//               onAdded={(title) => setAnnouncement(`Column ${title} added.`)}
//             />
//           </div>
//         </div>
//       </PerfProfiler>

//       <CardModalHost onAnnounce={setAnnouncement} />
//       <DeleteColumnDialog
//         onDeleted={(title) => handleDeleted('Column', title)}
//       />
//       <DeleteCardDialog onDeleted={(title) => handleDeleted('Card', title)} />

//       <DragPreview />
//       <DragAnnouncer />
//       <ConnectionStatus />

//       {PERF_LAB_ENABLED && (
//         <Suspense fallback={null}>
//           <PerfLab boardId={board.id} />
//         </Suspense>
//       )}

//       <p role="status" className="sr-only">
//         {announcement}
//       </p>
//     </div>
//   )
// }

import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ColumnsIcon } from '@/components/ui/icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddColumnForm } from '@/features/columns/AddColumnForm'
import { BoardSkeleton } from '@/features/columns/BoardSkeleton'
import { Column } from '@/features/columns/Column'
import { DeleteColumnDialog } from '@/features/columns/DeleteColumnDialog'
import { DragAnnouncer } from '@/features/dnd/DragAnnouncer'
import { DragPreview } from '@/features/dnd/DragPreview'
import { cancelKeyboardDrag } from '@/features/dnd/keyboardDrag'
import { cancelPointerDrag } from '@/features/dnd/pointerDrag'
import { HistoryControls } from '@/features/history/HistoryControls'
import { ConnectionStatus } from '@/features/realtime/ConnectionStatus'
import { useHistoryShortcuts } from '@/history/useHistoryShortcuts'
import { PerfProfiler } from '@/perf/PerfProfiler'
import { isPerfLabEnabled } from '@/perf/perfStats'
import { useBoard } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import NotFoundPage from './NotFoundPage'
import { CardModalHost } from '@/features/cards/CardModalHost'
import { DeleteCardDialog } from '@/features/cards/DeleteCardDialog'

// The lab is opt-in (?perf) and loaded on demand, so it costs normal users nothing.
const PERF_LAB_ENABLED = isPerfLabEnabled()
const PerfLab = lazy(() => import('@/perf/PerfLab'))

export default function BoardPage() {
  const { boardId = '' } = useParams()
  const board = useBoard(boardId)
  const syncing = useUIStore((s) => s.initialSync === 'pending')
  const [announcement, setAnnouncement] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useHistoryShortcuts(boardId)

  // Leaving the page must not leave a half-open edit, dialog, delete prompt or drag behind.
  useEffect(() => {
    return () => {
      const ui = useUIStore.getState()
      ui.stopEditingColumn()
      ui.closeCardModal()
      ui.cancelDelete()
      cancelPointerDrag()
      if (ui.drag?.mode === 'keyboard') {
        cancelKeyboardDrag(ui.drag.cardId, false)
      }
    }
  }, [])

  if (!board) {
    // A shared link can open before the first sync arrives: wait, don't say "not found".
    return syncing ? (
      <BoardSkeleton />
    ) : (
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
    // The board fills the viewport below the app header. The page never scrolls:
    // the board scrolls sideways, and each column scrolls its own cards.
    <div className="mesh-bg flex h-[calc(100dvh-var(--app-header-h))] flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-5 pb-4">
        <div className="glass flex items-start justify-between gap-4 rounded-card px-4 py-3">
          <div className="min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeftIcon width={16} height={16} />
              All boards
            </Link>

            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 text-2xl font-semibold tracking-tight wrap-break-word text-ink focus:outline-none"
            >
              {board.title}
            </h1>
            {board.description && (
              <p className="mt-1 max-w-3xl text-sm wrap-break-word text-ink-muted">
                {board.description}
              </p>
            )}
          </div>
          <HistoryControls />
        </div>
      </div>

      {/* data-board-scroller lets a drag auto-scroll the board sideways. */}
      <PerfProfiler id="board-columns">
        <div
          data-board-scroller
          className="thin-scroll flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden px-6 pb-4"
        >
          {/* Skipped when empty: an empty list would still claim a flex gap and a screen reader stop */}
          {board.columnIds.length > 0 && (
            <ul className="flex h-full items-start gap-4">
              {board.columnIds.map((id, index) => (
                <Column key={id} id={id} index={index} />
              ))}
            </ul>
          )}

          <div className="flex w-72 shrink-0 flex-col gap-3 self-start">
            {board.columnIds.length === 0 && (
              <EmptyState
                className="bg-surface/90 py-8"
                icon={<ColumnsIcon width={22} height={22} />}
                title="No columns yet"
                description="Columns are the stages of your workflow, like To do, In progress and Done. Add your first one."
              />
            )}
            <div className="glass rounded-card">
              <AddColumnForm
                boardId={board.id}
                columnCount={board.columnIds.length}
                onAdded={(title) => setAnnouncement(`Column ${title} added.`)}
              />
            </div>
          </div>
        </div>
      </PerfProfiler>

      <CardModalHost onAnnounce={setAnnouncement} />
      <DeleteColumnDialog
        onDeleted={(title) => handleDeleted('Column', title)}
      />
      <DeleteCardDialog onDeleted={(title) => handleDeleted('Card', title)} />

      <DragPreview />
      <DragAnnouncer />
      <ConnectionStatus />

      {PERF_LAB_ENABLED && (
        <Suspense fallback={null}>
          <PerfLab boardId={board.id} />
        </Suspense>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
