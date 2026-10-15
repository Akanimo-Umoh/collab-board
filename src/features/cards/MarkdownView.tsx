import { memo, useMemo } from 'react'
import { renderMarkdown } from '@/lib/markdown'

interface MarkdownViewProps {
  source: string
}

export const MarkdownView = memo(function MarkdownView({
  source,
}: MarkdownViewProps) {
  // Parsing + sanitizing is the costly part, so it only reruns when the text changes.
  const html = useMemo(
    () => (source.trim() ? renderMarkdown(source) : ''),
    [source],
  )

  if (!html) {
    return <p className="text-sm text-ink-muted/70 italic">No description</p>
  }

  return (
    <div
      className={[
        'prose prose-sm max-w-none wrap-break-word',
        '[--tw-prose-body:var(--color-ink)] [--tw-prose-headings:var(--color-ink)]',
        '[--tw-prose-bold:var(--color-ink)] [--tw-prose-links:var(--color-brand-600)]',
        'prose-code:rounded prose-code:bg-surface-muted prose-code:px-1 prose-code:py-0.5',
        'prose-code:font-medium prose-code:before:content-none prose-code:after:content-none',
      ].join(' ')}
      // Safe: `html` always comes from renderMarkdown, which sanitizes with DOMPurify.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
