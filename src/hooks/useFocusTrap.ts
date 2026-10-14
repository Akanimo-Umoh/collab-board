import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Open dialogs in stacking order. Only the topmost one handles the keyboard.
const openTraps: HTMLElement[] = []

/**
 * Traps keyboard focus inside `containerRef` while the component is mounted.
 * - On mount: focuses the element marked `data-autofocus`, otherwise the container itself.
 * - Tab / Shift+Tab cycle within the container.
 * - Escape calls `onEscape`.
 * - On unmount: focus returns to the element that was focused before the dialog opened.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
) {
  // Keep the latest callback without re-running the effect (which would reset focus).
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    openTraps.push(container)

    const initialTarget =
      container.querySelector<HTMLElement>('[data-autofocus]') ?? container
    initialTarget.focus()

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

    function handleKeyDown(event: KeyboardEvent) {
      if (openTraps[openTraps.length - 1] !== container) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (!container.contains(active)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      openTraps.splice(openTraps.indexOf(container), 1)
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [containerRef])
}
