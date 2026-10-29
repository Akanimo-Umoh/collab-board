import { memo, useEffect, useRef } from 'react'
import { IconButton } from '@/components/ui/IconButton'
import { PencilIcon, TrashIcon } from '@/components/ui/icons'
import { useDomainStore } from '@/store/domain/domainStore'
import { useColumn } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import { ColumnTitleEditor } from './ColumnTitleEditor'

interface ColumnHeaderProps {
  id: string
}

export const ColumnHeader = memo(function ColumnHeader({
  id,
}: ColumnHeaderProps) {
  const column = useColumn(id)
  // A boolean selector: only the column whose edit state flips re-renders.
  const isEditing = useUIStore((s) => s.editingColumnId === id)
  const startEditingColumn = useUIStore((s) => s.startEditingColumn)
  const stopEditingColumn = useUIStore((s) => s.stopEditingColumn)
  const requestDelete = useUIStore((s) => s.requestDelete)
  const renameColumn = useDomainStore((s) => s.renameColumn)

  const headerRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(false)

  // After a keyboard-driven finish, put focus back on the rename button.
  useEffect(() => {
    if (isEditing || !restoreFocus.current) return
    restoreFocus.current = false
    headerRef.current
      ?.querySelector<HTMLElement>('[data-edit-trigger]')
      ?.focus()
  }, [isEditing])

  if (!column) return null

  function handleDone(shouldRestoreFocus: boolean) {
    restoreFocus.current = shouldRestoreFocus
    stopEditingColumn()
  }

  return (
    <div
      ref={headerRef}
      className="flex items-center justify-between gap-2 px-3 py-3"
    >
      {isEditing ? (
        <ColumnTitleEditor
          initialTitle={column.title}
          onRename={(title) => renameColumn(id, title)}
          onDone={handleDone}
        />
      ) : (
        <>
          <h2 className="min-w-0 flex-1 text-sm font-semibold wrap-break-word text-ink">
            {column.title}
          </h2>
          <div className="flex shrink-0 items-center">
            <IconButton
              data-edit-trigger
              label={`Rename column ${column.title}`}
              onClick={() => startEditingColumn(id)}
            >
              <PencilIcon width={16} height={16} />
            </IconButton>
            <IconButton
              label={`Delete column ${column.title}`}
              onClick={() => requestDelete({ type: 'column', id })}
            >
              <TrashIcon width={16} height={16} />
            </IconButton>
          </div>
        </>
      )}
    </div>
  )
})
