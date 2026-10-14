import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextArea, TextField } from '@/components/ui/TextField'
import { useDomainStore } from '@/store/domain/domainStore'

interface CreateBoardDialogProps {
  onClose: () => void
  onCreated: (title: string) => void
}

const TITLE_MAX = 60
const DESCRIPTION_MAX = 200

export function CreateBoardDialog({
  onClose,
  onCreated,
}: CreateBoardDialogProps) {
  const createBoard = useDomainStore((s) => s.createBoard)
  const formRef = useRef<HTMLFormElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState('')

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value)
    if (titleError) setTitleError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Give your board a title.')
      const field = formRef.current?.elements.namedItem('title')
      if (field instanceof HTMLInputElement) field.focus()
      return
    }

    createBoard({ title: trimmedTitle, description })
    onCreated(trimmedTitle)
    onClose()
  }

  return (
    <Modal
      title="Create board"
      description="Give your board a name and an optional description."
      onClose={onClose}
    >
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
          onChange={handleTitleChange}
          error={titleError}
          placeholder="e.g. Product roadmap"
        />

        <TextArea
          name="description"
          label="Description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          hint={`Optional. Up to ${DESCRIPTION_MAX} characters.`}
          placeholder="What is this board for?"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create board</Button>
        </div>
      </form>
    </Modal>
  )
}
