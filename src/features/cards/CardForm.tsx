import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { TextArea, TextField } from '@/components/ui/TextField'
import type { CardInput } from '@/types/domain'
import { TagInput } from './TagInput'

interface CardFormProps {
  initial?: CardInput
  submitLabel: string
  /**
   * Focus the title on mount. Leave off when a dialog is mounting at the same time:
   * its focus trap handles initial focus and must record the right element to return to.
   */
  focusTitleOnMount?: boolean
  onSubmit: (input: CardInput) => void
  onCancel: () => void
}

const TITLE_MAX = 80
const DESCRIPTION_MAX = 2000

export function CardForm({
  initial,
  submitLabel,
  focusTitleOnMount = false,
  onSubmit,
  onCancel,
}: CardFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [titleError, setTitleError] = useState('')

  useEffect(() => {
    if (focusTitleOnMount) {
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="title"]')
        ?.focus()
    }
  }, [focusTitleOnMount])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Give the card a title.')
      formRef.current
        ?.querySelector<HTMLInputElement>('input[name="title"]')
        ?.focus()
      return
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      tags,
      dueDate: dueDate || null,
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <TextField
        name="title"
        label="Title"
        required
        data-autofocus
        autoComplete="off"
        maxLength={TITLE_MAX}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value)
          if (titleError) setTitleError('')
        }}
        error={titleError}
        placeholder="e.g. Draft launch announcement"
      />

      <TextArea
        name="description"
        label="Description"
        rows={6}
        maxLength={DESCRIPTION_MAX}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        hint="Markdown supported: **bold**, _italic_, `code`, lists, headings and links."
        placeholder="Add more detail..."
      />

      <TagInput label="Tags" tags={tags} onChange={setTags} />

      <div className="max-w-xs">
        <TextField
          name="dueDate"
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
