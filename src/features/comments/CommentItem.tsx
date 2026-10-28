import { memo, useEffect, useId, useRef, useState } from 'react'
import { MAX_REPLY_DEPTH, formatCommentTime } from '@/lib/comments'
import { getIdentity } from '@/lib/identity'
import { useDomainStore } from '@/store/domain/domainStore'
import { useComment, useReplyIds } from '@/store/hooks'
import { useAnnouncerStore } from '@/store/ui/announcerStore'
import { CommentForm } from './CommentForm'

type Mode = 'idle' | 'replying' | 'editing' | 'confirmingDelete'
type Action = 'reply' | 'edit' | 'delete'

interface CommentItemProps {
  id: string
  /** 0 for a top-level comment. */
  depth: number
}

const actionButton =
  'rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-muted hover:bg-surface-muted hover:text-ink'

function CommentItemView({ id, depth }: CommentItemProps) {
  const comment = useComment(id)
  const replyIds = useReplyIds(id)
  const [mode, setMode] = useState<Mode>('idle')
  const [collapsed, setCollapsed] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const repliesId = useId()

  // Entering the delete confirmation moves focus onto its button.
  useEffect(() => {
    if (mode !== 'confirmingDelete') return
    contentRef.current
      ?.querySelector<HTMLElement>('[data-action="confirm-delete"]')
      ?.focus()
  }, [mode])

  if (!comment) return null

  const isOwn = comment.authorId === getIdentity().id
  const edited = !comment.deleted && comment.updatedAt !== comment.createdAt
  const preview = comment.body.slice(0, 40)

  /** Back to the plain view; focus goes to the button that opened the form, or the comment itself. */
  function returnToIdle(focusAction?: Action) {
    setMode('idle')
    requestAnimationFrame(() => {
      const root = contentRef.current
      if (!root) return
      const target = focusAction
        ? root.querySelector<HTMLElement>(`[data-action="${focusAction}"]`)
        : root
      target?.focus()
    })
  }

  function confirmDelete() {
    useDomainStore.getState().deleteComment(id)
    useAnnouncerStore.getState().announce('Comment deleted.')
    returnToIdle()
  }

  return (
    <li className="flex flex-col gap-2">
      <div
        ref={contentRef}
        tabIndex={-1}
        className="flex flex-col gap-1.5 rounded-md focus:outline-none"
      >
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-ink-muted">
          <span className="font-medium text-ink">
            {comment.authorName}
            {isOwn ? ' (you)' : ''}
          </span>
          <time dateTime={comment.createdAt}>
            {formatCommentTime(comment.createdAt)}
          </time>
          {edited && <span>(edited)</span>}
        </p>

        {comment.deleted ? (
          <p className="text-sm text-ink-muted italic">
            This comment was deleted.
          </p>
        ) : mode === 'editing' ? (
          <CommentForm
            label="Edit your comment"
            submitLabel="Save"
            initialValue={comment.body}
            focusOnMount
            onSubmit={(body) => {
              useDomainStore.getState().editComment(id, body)
              useAnnouncerStore.getState().announce('Comment updated.')
              returnToIdle('edit')
            }}
            onCancel={() => returnToIdle('edit')}
          />
        ) : (
          <p className="text-sm wrap-break-word whitespace-pre-wrap text-ink">
            {comment.body}
          </p>
        )}

        {!comment.deleted && mode === 'idle' && (
          <div className="flex flex-wrap items-center gap-1">
            {depth < MAX_REPLY_DEPTH && (
              <button
                type="button"
                data-action="reply"
                aria-label={`Reply to ${comment.authorName}: ${preview}`}
                onClick={() => setMode('replying')}
                className={actionButton}
              >
                Reply
              </button>
            )}
            {isOwn && (
              <>
                <button
                  type="button"
                  data-action="edit"
                  aria-label={`Edit your comment: ${preview}`}
                  onClick={() => setMode('editing')}
                  className={actionButton}
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-action="delete"
                  aria-label={`Delete your comment: ${preview}`}
                  onClick={() => setMode('confirmingDelete')}
                  className={actionButton}
                >
                  Delete
                </button>
              </>
            )}
            {replyIds.length > 0 && (
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-controls={repliesId}
                onClick={() => setCollapsed((value) => !value)}
                className={actionButton}
              >
                {collapsed ? 'Show' : 'Hide'} replies ({replyIds.length})
              </button>
            )}
          </div>
        )}

        {mode === 'confirmingDelete' && !comment.deleted && (
          <div
            role="group"
            aria-label="Confirm delete"
            className="flex flex-wrap items-center gap-2 text-sm text-ink"
          >
            <span>Delete this comment?</span>
            <button
              type="button"
              data-action="confirm-delete"
              onClick={confirmDelete}
              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => returnToIdle('delete')}
              className={actionButton}
            >
              Cancel
            </button>
          </div>
        )}

        {mode === 'replying' && !comment.deleted && (
          <CommentForm
            label={`Reply to ${comment.authorName}`}
            submitLabel="Reply"
            focusOnMount
            onSubmit={(body) => {
              useDomainStore.getState().addComment(comment.cardId, id, body)
              useAnnouncerStore.getState().announce('Reply added.')
              setCollapsed(false)
              returnToIdle('reply')
            }}
            onCancel={() => returnToIdle('reply')}
          />
        )}
      </div>

      {replyIds.length > 0 && !collapsed && (
        <ul
          id={repliesId}
          className="ml-2 flex flex-col gap-3 border-l border-border pl-4"
        >
          {replyIds.map((replyId) => (
            <CommentItem key={replyId} id={replyId} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

// The view is wrapped AFTER it is defined. If the memo() call wrapped an inline named function, that name would shadow this constant inside the function, and replies would render the un-memoized version, defeating the memoization.
export const CommentItem = memo(CommentItemView)
