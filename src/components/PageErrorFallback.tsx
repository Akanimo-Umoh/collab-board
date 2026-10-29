import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AlertIcon } from '@/components/ui/icons'

interface PageErrorFallbackProps {
  error: Error
  reset: () => void
}

export function PageErrorFallback({ error, reset }: PageErrorFallbackProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the message so screen reader users hear what happened.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-20 text-center"
    >
      <span className="rounded-full bg-danger-500/10 p-3 text-danger-500">
        <AlertIcon width={24} height={24} />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-ink focus:outline-none"
      >
        Something went wrong
      </h1>
      <p className="text-sm text-ink-muted">
        This page hit an unexpected problem. Your boards are saved on this
        device, so nothing was lost.
      </p>
      {import.meta.env.DEV && (
        <pre className="max-w-full overflow-auto rounded-md bg-surface-muted p-3 text-left text-xs whitespace-pre-wrap text-ink">
          {error.message}
        </pre>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Back to boards
        </Link>
      </div>
    </div>
  )
}
