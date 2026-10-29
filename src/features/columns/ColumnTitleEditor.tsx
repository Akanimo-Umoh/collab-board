import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

interface ColumnTitleEditorProps {
  initialTitle: string
  onRename: (title: string) => void
  /** `restoreFocus` is true when the user finished with the keyboard (Enter or Escape). */
  onDone: (restoreFocus: boolean) => void
}

const TITLE_MAX = 40

export function ColumnTitleEditor({
  initialTitle,
  onRename,
  onDone,
}: ColumnTitleEditorProps) {
  const [draft, setDraft] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function commit(restoreFocus: boolean) {
    if (finished.current) return
    finished.current = true

    // Clearing the name and leaving reverts to the old title instead of saving nothing.
    const next = draft.trim()
    if (next && next !== initialTitle) onRename(next)
    onDone(restoreFocus)
  }

  function cancel() {
    if (finished.current) return
    finished.current = true
    onDone(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(true)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      maxLength={TITLE_MAX}
      aria-label="Column title"
      autoComplete="off"
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => commit(false)}
      className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-sm font-semibold text-ink"
    />
  )
}
