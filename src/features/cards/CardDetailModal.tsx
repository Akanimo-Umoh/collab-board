import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CommentSection } from '@/features/comments/CommentSection'
import { formatDueDate } from '@/lib/date'
import { diffCardPatch } from '@/realtime/operations'
import { useDomainStore } from '@/store/domain/domainStore'
import { useCard, useColumn } from '@/store/hooks'
import { useUIStore } from '@/store/ui/uiStore'
import type { CardInput } from '@/types/domain'
import { CardForm } from './CardForm'
import { MarkdownView } from './MarkdownView'
import { TagList } from './TagList'

interface CardDetailModalProps {
  cardId: string
  onClose: () => void
  onAnnounce: (message: string) => void
}

const labelClass = 'text-xs font-medium uppercase tracking-wide text-ink-muted'

export function CardDetailModal({
  cardId,
  onClose,
  onAnnounce,
}: CardDetailModalProps) {
  const card = useCard(cardId)
  const column = useColumn(card ? card.columnId : '')
  const updateCard = useDomainStore((s) => s.updateCard)
  const requestDelete = useUIStore((s) => s.requestDelete)

  // The values the form started with. While this is set, the card is being edited.
  // Keeping them lets us send only what THIS user changed, and keeps the form from resetting if someone else edits the card while it is open.
  const [baseline, setBaseline] = useState<CardInput | null>(null)
  const editing = baseline !== null
  const containerRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(false)

  // After leaving edit mode, put focus back on the Edit button.
  useEffect(() => {
    if (editing || !restoreFocus.current) return
    restoreFocus.current = false
    containerRef.current
      ?.querySelector<HTMLElement>('[data-edit-trigger]')
      ?.focus()
  }, [editing])

  // The card can vanish while this dialog is open (deleted from another session). Close the dialog, and move focus somewhere real: the card's button is gone, so focus would otherwise drop to <body>.
  useEffect(() => {
    if (card) return
    onClose()
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('h1')?.focus(),
    )
  }, [card, onClose])

  if (!card) return null

  function startEditing() {
    if (!card) return
    setBaseline({
      title: card.title,
      description: card.description,
      tags: card.tags,
      dueDate: card.dueDate,
    })
  }

  function finishEditing() {
    restoreFocus.current = true
    setBaseline(null)
  }

  function handleSave(input: CardInput) {
    if (baseline) {
      // Only the fields this user changed. The store compares again against the live card, so a field someone else edited meanwhile survives.
      const patch = diffCardPatch(baseline, input)
      if (patch) updateCard(cardId, patch)
    }
    onAnnounce(`Card ${input.title} saved.`)
    finishEditing()
  }

  return (
    <Modal
      title={editing ? 'Edit card' : card.title}
      description={!editing && column ? `In ${column.title}` : undefined}
      onClose={onClose}
      size="lg"
    >
      <div ref={containerRef}>
        {baseline ? (
          <CardForm
            initial={baseline}
            submitLabel="Save changes"
            focusTitleOnMount
            onSubmit={handleSave}
            onCancel={finishEditing}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <section aria-label="Description">
              <MarkdownView source={card.description} />
            </section>

            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <dt className={labelClass}>Tags</dt>
                <dd>
                  {card.tags.length > 0 ? (
                    <TagList tags={card.tags} />
                  ) : (
                    <span className="text-sm text-ink-muted">No tags</span>
                  )}
                </dd>
              </div>

              <div className="flex flex-col gap-1.5">
                <dt className={labelClass}>Due date</dt>
                <dd className="text-sm text-ink">
                  {card.dueDate ? (
                    <time dateTime={card.dueDate}>
                      {formatDueDate(card.dueDate)}
                    </time>
                  ) : (
                    <span className="text-ink-muted">No due date</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex justify-between gap-3 border-t border-border pt-4">
              <Button
                variant="danger"
                onClick={() => requestDelete({ type: 'card', id: card.id })}
              >
                Delete card
              </Button>
              <Button data-edit-trigger onClick={startEditing}>
                Edit card
              </Button>
            </div>

            <CommentSection cardId={card.id} />
          </div>
        )}
      </div>
    </Modal>
  )
}
