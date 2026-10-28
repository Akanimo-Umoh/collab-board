import { useId } from 'react'
import { useDomainStore } from '@/store/domain/domainStore'
import { useReplyIds } from '@/store/hooks'
import { useAnnouncerStore } from '@/store/ui/announcerStore'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'

interface CommentSectionProps {
  cardId: string
}

export function CommentSection({ cardId }: CommentSectionProps) {
  const rootIds = useReplyIds(cardId)
  const message = useAnnouncerStore((s) => s.message)
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 border-t border-border pt-4"
    >
      <h3 id={headingId} className="text-sm font-semibold text-ink">
        Comments
      </h3>

      {rootIds.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {rootIds.map((id) => (
            <CommentItem key={id} id={id} depth={0} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">
          No comments yet. Start the conversation.
        </p>
      )}

      <CommentForm
        label="Add a comment"
        submitLabel="Comment"
        onSubmit={(body) => {
          useDomainStore.getState().addComment(cardId, null, body)
          useAnnouncerStore.getState().announce('Comment added.')
        }}
      />

      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  )
}
