import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Image is null because I've not found the perfect picture for that, the page shows the built-in acorn illustration instead.*/
const NOT_FOUND_IMAGE: string | null = null
const NOT_FOUND_IMAGE_ALT = 'A squirrel chasing an acorn across the ice'

function AcornIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* stem */}
      <path
        d="M32 3c0 6-1 9-3 12"
        fill="none"
        stroke="#6b4a2b"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* nut */}
      <path d="M10 34c0 22 10 42 22 44 12-2 22-22 22-44z" fill="#b9773a" />
      {/* cap */}
      <path d="M6 36c0-14 11-24 26-24s26 10 26 24z" fill="#7a4f2a" />
      {/* highlight */}
      <path
        d="M22 47c2 8 5 14 10 19"
        fill="none"
        stroke="#d9a066"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface NotFoundPageProps {
  heading?: string
  message?: string
  actionLabel?: string
  actionTo?: string
}

export default function NotFoundPage({
  heading = 'Page not found',
  message = 'Like an acorn lost to the ice age, this page slipped away. The link may be broken, or the page may have moved.',
  actionLabel = 'Back to dashboard',
  actionTo = '/',
}: NotFoundPageProps) {
  // Give the tab a meaningful title, and restore the previous one on leave.
  useEffect(() => {
    const previous = document.title
    document.title = `${heading} · CollabBoard`
    return () => {
      document.title = previous
    }
  }, [heading])

  return (
    <div className="relative flex min-h-[calc(100dvh-57px)] items-center justify-center overflow-hidden px-6 py-16">
      {/* Decorative ice glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-100/70 blur-3xl"
      />

      <div className="relative flex max-w-lg flex-col items-center text-center">
        {NOT_FOUND_IMAGE ? (
          <img
            src={NOT_FOUND_IMAGE}
            alt={NOT_FOUND_IMAGE_ALT}
            width={320}
            height={240}
            decoding="async"
            className="mb-6 h-auto w-72 max-w-full rounded-xl object-contain"
          />
        ) : (
          // The visual "404" is decorative; the h1 below carries the meaning.
          <p
            aria-hidden="true"
            className="mb-6 flex items-center justify-center gap-1 text-8xl font-bold tracking-tight text-ink select-none"
          >
            <span>4</span>
            <AcornIcon
              className={cn('h-24 w-auto motion-safe:animate-wobble')}
            />
            <span>4</span>
          </p>
        )}

        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-3 text-base text-ink-muted">{message}</p>

        <Link
          to={actionTo}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  )
}
