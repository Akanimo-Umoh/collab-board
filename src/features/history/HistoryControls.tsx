import { UndoIcon } from '@/components/ui/icons'
import { useHistoryStore } from '@/history/historyStore'

interface HistoryButtonProps {
  name: 'Undo' | 'Redo'
  shortcut: string
  /** What the next step would do; null when there is nothing to step through. */
  label: string | null
  onActivate: () => void
}

function HistoryButton({
  name,
  shortcut,
  label,
  onActivate,
}: HistoryButtonProps) {
  const empty = label === null
  return (
    <button
      type="button"
      // aria-disabled (not disabled) so focus stays put when the stack empties.
      aria-disabled={empty}
      aria-label={
        empty
          ? `${name} (nothing to ${name.toLowerCase()})`
          : `${name}: ${label}`
      }
      title={`${name} (${shortcut})`}
      onClick={() => {
        if (!empty) onActivate()
      }}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-ink ${
        empty ? 'cursor-not-allowed opacity-40' : 'hover:bg-surface-muted'
      }`}
    >
      <UndoIcon
        width={16}
        height={16}
        className={name === 'Redo' ? '-scale-x-100' : undefined}
      />
      {name}
    </button>
  )
}

export function HistoryControls() {
  const undoLabel = useHistoryStore((s) => s.undoStack.at(-1)?.label ?? null)
  const redoLabel = useHistoryStore((s) => s.redoStack.at(-1)?.label ?? null)
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)

  return (
    <div
      role="group"
      aria-label="History"
      className="flex shrink-0 items-center gap-2"
    >
      <HistoryButton
        name="Undo"
        shortcut="Ctrl+Z"
        label={undoLabel}
        onActivate={undo}
      />
      <HistoryButton
        name="Redo"
        shortcut="Ctrl+Shift+Z"
        label={redoLabel}
        onActivate={redo}
      />
    </div>
  )
}
