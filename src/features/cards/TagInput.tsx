import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { TAG_MAX_COUNT, TAG_MAX_LENGTH, hasTag, normalizeTag } from '@/lib/tags'

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ label, tags, onChange }: TagInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('')

  function commitDraft() {
    const tag = normalizeTag(draft)
    setDraft('')
    if (!tag) return

    if (hasTag(tags, tag)) {
      setStatus(`Tag ${tag} is already added.`)
    } else if (tags.length >= TAG_MAX_COUNT) {
      setStatus(`You can add up to ${TAG_MAX_COUNT} tags.`)
    } else {
      onChange([...tags, tag])
      setStatus(`Added tag ${tag}.`)
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((existing) => existing !== tag))
    setStatus(`Removed tag ${tag}.`)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter must not submit the surrounding form.
      event.preventDefault()
      commitDraft()
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-brand-500">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 py-0.5 pr-1 pl-2 text-xs font-medium text-brand-600"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => {
                removeTag(tag)
                inputRef.current?.focus()
              }}
              className="inline-flex size-4 items-center justify-center rounded-full hover:bg-brand-500/20"
            >
              <CloseIcon width={10} height={10} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          maxLength={TAG_MAX_LENGTH}
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          placeholder={tags.length === 0 ? 'e.g. design' : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          // Commit typed text on blur so pressing Save never drops a half-typed tag.
          onBlur={() => {
            if (draft.trim()) commitDraft()
          }}
          className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm text-ink placeholder:text-ink-muted/70 focus-visible:outline-hidden"
        />
      </div>

      <p id={`${id}-hint`} className="text-xs text-ink-muted">
        Press Enter or comma to add a tag. Up to {TAG_MAX_COUNT} tags.
      </p>

      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  )
}
