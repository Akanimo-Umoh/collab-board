import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Links inside rendered markdown open in a new tab without leaking the opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/**
 The single place where untrusted markdown becomes HTML. Parse first, then sanitize, so the output is always safe to inject.
*/
export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false })
  return DOMPurify.sanitize(html)
}
