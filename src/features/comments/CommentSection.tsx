import { useId, useRef } from 'react'
import { useDomainStore } from '@/store/domain/domainStore'
import { useReplyIds } from '@/store/hooks'
import { useAnnouncerStore } from '@/store/ui/announcerStore'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { usePagedIds } from './usePagedIds'

const PAGE_SIZE = 30

interface CommentSectionProps {
  cardId: string
}

export function CommentSection({ cardId }: CommentSectionProps) {
  const rootIds = useReplyIds(cardId)
  const { visibleIds, hiddenCount, showEarlier } = usePagedIds(
    rootIds,
    PAGE_SIZE,
  )
  const message = useAnnouncerStore((s) => s.message)
  const listRef = useRef<HTMLUListElement>(null)
  const headingId = useId()

  function handleShowEarlier() {
    showEarlier()
    useAnnouncerStore
      .getState()
      .announce(`Showing ${Math.min(hiddenCount, PAGE_SIZE)} earlier comments.`)
    // If that was the last page the button disappears, so keep focus in the thread.
    if (hiddenCount <= PAGE_SIZE) {
      requestAnimationFrame(() => listRef.current?.focus())
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 border-t border-border pt-4"
    >
      <h3 id={headingId} className="text-sm font-semibold text-ink">
        Comments{rootIds.length > 0 ? ` (${rootIds.length})` : ''}
      </h3>

      {rootIds.length > 0 ? (
        <div className="flex flex-col gap-3">
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={handleShowEarlier}
              className="self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              Show {Math.min(hiddenCount, PAGE_SIZE)} earlier comments (
              {hiddenCount} hidden)
            </button>
          )}
          <ul
            ref={listRef}
            tabIndex={-1}
            className="flex flex-col gap-4 focus:outline-none"
          >
            {visibleIds.map((id) => (
              <CommentItem key={id} id={id} depth={0} />
            ))}
          </ul>
        </div>
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
