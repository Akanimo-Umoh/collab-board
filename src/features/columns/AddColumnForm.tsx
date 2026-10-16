import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { PlusIcon } from '@/components/ui/icons'
import { TextField } from '@/components/ui/TextField'
import { useDomainStore } from '@/store/domain/domainStore'

interface AddColumnFormProps {
  boardId: string
  columnCount: number
  onAdded: (title: string) => void
}

const TITLE_MAX = 40

export function AddColumnForm({
  boardId,
  columnCount,
  onAdded,
}: AddColumnFormProps) {
  const addColumn = useDomainStore((s) => s.addColumn)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const rootRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(false)

  // Opening focuses the field; closing (by the user) returns focus to the button.
  useEffect(() => {
    if (open) {
      rootRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      rootRef.current?.querySelector<HTMLElement>('[data-add-trigger]')?.focus()
    }
  }, [open])

  // Keep the form visible as columns are added to the right.
  useEffect(() => {
    if (open)
      rootRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [open, columnCount])

  // Escape closes the form from any field or button inside it. The listener is attached
  // to the wrapper only while the form is open, so no key handler sits on the <form> itself.
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      restoreFocus.current = true
      setTitle('')
      setError('')
      setOpen(false)
    }

    root.addEventListener('keydown', handleKeyDown)
    return () => root.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function close() {
    restoreFocus.current = true
    setTitle('')
    setError('')
    setOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = title.trim()
    if (!trimmed) {
      setError('Give the column a title.')
      rootRef.current?.querySelector<HTMLInputElement>('input')?.focus()
      return
    }

    addColumn(boardId, trimmed)
    onAdded(trimmed)
    setTitle('')
    setError('')
  }

  return (
    <div ref={rootRef}>
      {open ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-card"
        >
          <TextField
            name="title"
            label="Column title"
            required
            autoComplete="off"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (error) setError('')
            }}
            error={error}
            placeholder="e.g. In progress"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Add column
            </Button>
            <Button variant="ghost" size="sm" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="secondary"
          data-add-trigger
          className="w-full justify-start"
          onClick={() => setOpen(true)}
        >
          <PlusIcon width={16} height={16} />
          Add column
        </Button>
      )}
    </div>
  )
}
