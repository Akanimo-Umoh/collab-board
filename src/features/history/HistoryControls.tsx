import { useHistoryStore } from '@/history/historyStore'

function ArrowIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={flip ? '-scale-x-100' : undefined}
    >
      <path d="M6 4 3 7l3 3" />
      <path d="M3 7h6.5a3.5 3.5 0 0 1 0 7H7" />
    </svg>
  )
}

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
      <ArrowIcon flip={name === 'Redo'} />
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
