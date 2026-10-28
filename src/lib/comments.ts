export const MAX_COMMENT_LENGTH = 2000

/**
 * How deep a reply can nest below a top-level comment (0 = top level).
 * The data model has no limit; the UI just stops offering "Reply" here so threads stay readable.
 */
export const MAX_REPLY_DEPTH = 4

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCommentTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : formatter.format(date)
}
