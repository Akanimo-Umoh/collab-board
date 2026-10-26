import { useLayoutEffect, useRef } from 'react'
import { useUIStore } from '@/store/ui/uiStore'
import { DND_INSTRUCTIONS_ID } from './constants'
import { handleHandleBlur, handleHandleKeyDown } from './keyboardDrag'

interface DragHandleProps {
  cardId: string
  title: string
}

export function DragHandle({ cardId, title }: DragHandleProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const grabbed = useUIStore((s) => {
    const drag = s.drag
    return drag !== null && drag.mode === 'keyboard' && drag.cardId === cardId
  })

  // Moving to another column remounts the card; give focus to the new handle.
  useLayoutEffect(() => {
    if (grabbed) ref.current?.focus()
  }, [grabbed])

  return (
    <button
      ref={ref}
      type="button"
      data-card-handle={cardId}
      aria-label={`Move card ${title}`}
      aria-describedby={DND_INSTRUCTIONS_ID}
      aria-pressed={grabbed}
      onKeyDown={(event) => handleHandleKeyDown(event, cardId)}
      onBlur={() => handleHandleBlur(cardId)}
      className="absolute top-2 right-2 flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-ink-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface-muted hover:text-ink focus-visible:opacity-100 aria-pressed:bg-surface-muted aria-pressed:text-ink aria-pressed:opacity-100 motion-safe:transition-opacity pointer-coarse:opacity-100"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
      >
        <circle cx="4.5" cy="3" r="1.25" />
        <circle cx="9.5" cy="3" r="1.25" />
        <circle cx="4.5" cy="7" r="1.25" />
        <circle cx="9.5" cy="7" r="1.25" />
        <circle cx="4.5" cy="11" r="1.25" />
        <circle cx="9.5" cy="11" r="1.25" />
      </svg>
    </button>
  )
}
