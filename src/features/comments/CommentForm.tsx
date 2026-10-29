import { useEffect, useId, useRef, useState } from 'react'
import { MAX_COMMENT_LENGTH } from '@/lib/comments'
import { Textarea } from '@/components/ui/Input'

interface CommentFormProps {
  /** Accessible name of the text box (also its placeholder). */
  label: string
  submitLabel: string
  initialValue?: string
  focusOnMount?: boolean
  onSubmit: (body: string) => void
  /** When given, shows a Cancel button and Escape cancels. */
  onCancel?: () => void
}

export function CommentForm({
  label,
  submitLabel,
  initialValue = '',
  focusOnMount = false,
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  useEffect(() => {
    if (!focusOnMount) return
    const el = textareaRef.current
    el?.focus()
    el?.setSelectionRange(el.value.length, el.value.length)
  }, [focusOnMount])

  function submit() {
    const body = value.trim()
    if (!body) {
      setError('Write a comment first.')
      textareaRef.current?.focus()
      return
    }
    if (body.length > MAX_COMMENT_LENGTH) {
      setError(`Comments can be at most ${MAX_COMMENT_LENGTH} characters.`)
      textareaRef.current?.focus()
      return
    }
    setError('')
    onSubmit(body)
    setValue('')
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <Textarea
        id={fieldId}
        ref={textareaRef}
        rows={3}
        value={value}
        placeholder={label}
        invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          setValue(event.target.value)
          if (error) setError('')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCancel) {
            // Cancel this form only: don't let Escape also close the card dialog.
            event.preventDefault()
            event.stopPropagation()
            onCancel()
          } else if (
            event.key === 'Enter' &&
            (event.ctrlKey || event.metaKey)
          ) {
            event.preventDefault()
            submit()
          }
        }}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger-500">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
