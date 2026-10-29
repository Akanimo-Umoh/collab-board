import { useEffect, useState } from 'react'
import {
  useToastStore,
  type Toast,
  type ToastTone,
} from '@/store/ui/toastStore'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'

const DOT_CLASSES: Record<ToastTone, string> = {
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  error: 'bg-red-500',
}

function ToastItem({ item }: { item: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const [paused, setPaused] = useState(false)
  const { action } = item

  // The timer stops while the pointer or keyboard focus is on the toast, so nobody loses a message (or the Undo button) while they are reading it.
  useEffect(() => {
    if (item.duration === 0 || paused) return undefined
    const timer = setTimeout(() => dismiss(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, paused, dismiss])

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-modal motion-safe:transition motion-safe:duration-200 starting:translate-y-2 starting:opacity-0"
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${DOT_CLASSES[item.tone]}`}
      />
      <div
        role={item.tone === 'error' ? 'alert' : undefined}
        className="flex min-w-0 flex-1 flex-col items-start gap-1.5"
      >
        <p className="text-sm wrap-break-word text-ink">{item.message}</p>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onAction()
              dismiss(item.id)
            }}
            className="rounded-md text-sm font-medium text-ink underline underline-offset-2 hover:opacity-80"
          >
            {action.label}
          </button>
        )}
      </div>
      <IconButton label="Dismiss notification" onClick={() => dismiss(item.id)}>
        <CloseIcon />
      </IconButton>
    </li>
  )
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)

  // The live region stays mounted even when empty: screen readers only announce additions to a region that already exists.
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed top-4 right-4 z-60 w-[calc(100%-2rem)] max-w-sm"
    >
      {toasts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {toasts.map((item) => (
            <ToastItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}
