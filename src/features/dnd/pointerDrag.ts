import type { PointerEvent as ReactPointerEvent } from 'react'
import { getEdgeScrollDelta, getInsertIndex } from '@/lib/dnd'
import type { CardPosition } from '@/lib/ordering'
import { useDomainStore } from '@/store/domain/domainStore'
import { useUIStore } from '@/store/ui/uiStore'
import type { ID } from '@/types/domain'
import { DRAG_START_DISTANCE } from './constants'
import { dropCard } from './persistMove'
import { describeCardPosition } from './positions'

let cancelActiveDrag: (() => void) | null = null

/** Abort a pointer drag in progress (used when the board page unmounts). */
export function cancelPointerDrag(): void {
  cancelActiveDrag?.()
}

/** Which column is under the pointer, and where in it the card would land. */
function resolveTarget(x: number, y: number, cardId: ID): CardPosition | null {
  const column = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>('[data-drop-column]')
  const columnId = column?.dataset.dropColumn
  if (!column || !columnId) return null

  const midpoints: number[] = []
  column.querySelectorAll<HTMLElement>('[data-card-id]').forEach((el) => {
    if (el.dataset.cardId === cardId) return
    const rect = el.getBoundingClientRect()
    midpoints.push(rect.top + rect.height / 2)
  })
  return { columnId, index: getInsertIndex(midpoints, y) }
}

/** Scrolls the board (and page) when the pointer nears an edge. True if it moved. */
function autoScroll(
  x: number,
  y: number,
  scroller: HTMLElement | null,
): boolean {
  let scrolled = false

  if (scroller) {
    const bounds = scroller.getBoundingClientRect()
    const dx = getEdgeScrollDelta(x, bounds.left, bounds.right)
    if (dx !== 0) {
      const before = scroller.scrollLeft
      scroller.scrollLeft += dx
      scrolled = scrolled || scroller.scrollLeft !== before
    }
  }

  const dy = getEdgeScrollDelta(y, 0, window.innerHeight)
  if (dy !== 0) {
    const before = window.scrollY
    window.scrollBy(0, dy)
    scrolled = scrolled || window.scrollY !== before
  }

  return scrolled
}

/** A drag must not also count as a click on the card underneath the pointer. */
function suppressNextClick(): void {
  const stop = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
  }
  window.addEventListener('click', stop, { capture: true, once: true })
  setTimeout(
    () => window.removeEventListener('click', stop, { capture: true }),
    0,
  )
}

export function beginPointerDrag(
  event: ReactPointerEvent<HTMLElement>,
  cardId: ID,
): void {
  if (event.button !== 0 || !event.isPrimary) return
  if (useUIStore.getState().drag) return

  // React nulls event.currentTarget after the handler, so capture it now.
  const element = event.currentTarget
  const scroller = element.closest<HTMLElement>('[data-board-scroller]')
  const pointerId = event.pointerId
  const originX = event.clientX
  const originY = event.clientY
  let x = originX
  let y = originY
  let dragging = false
  let frame = 0

  const cancel = () => finish(false)

  function start(): boolean {
    const { cards, columns } = useDomainStore.getState()
    const card = cards[cardId]
    if (!card) return false
    const column = columns[card.columnId]
    if (!column) return false

    const rect = element.getBoundingClientRect()
    useUIStore.getState().startDrag({
      cardId,
      mode: 'pointer',
      origin: { columnId: column.id, index: column.cardIds.indexOf(cardId) },
      over: null,
      preview: {
        startX: x,
        startY: y,
        offsetX: originX - rect.left,
        offsetY: originY - rect.top,
        width: rect.width,
      },
    })
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    return true
  }

  function schedule(): void {
    if (!frame) frame = requestAnimationFrame(tick)
  }

  function tick(): void {
    frame = 0
    const scrolled = autoScroll(x, y, scroller)
    syncTarget()
    // Keep going while the board is still scrolling under a stationary pointer.
    if (scrolled) schedule()
  }

  function syncTarget(): void {
    const ui = useUIStore.getState()
    const drag = ui.drag
    if (!drag) return
    const target = resolveTarget(x, y, cardId)
    const isNoop =
      target !== null &&
      target.columnId === drag.origin.columnId &&
      target.index === drag.origin.index
    ui.setDragOver(target && !isNoop ? target : null)
  }

  function onMove(e: PointerEvent): void {
    if (e.pointerId !== pointerId) return
    x = e.clientX
    y = e.clientY

    if (!dragging) {
      if (Math.hypot(x - originX, y - originY) < DRAG_START_DISTANCE) return
      dragging = start()
      if (!dragging) {
        finish(false)
        return
      }
    }
    schedule()
  }

  function onUp(e: PointerEvent): void {
    if (e.pointerId === pointerId) finish(true)
  }

  function onPointerCancel(e: PointerEvent): void {
    if (e.pointerId === pointerId) finish(false)
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') finish(false)
  }

  function finish(commit: boolean): void {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onPointerCancel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('scroll', schedule, true)
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    if (cancelActiveDrag === cancel) cancelActiveDrag = null

    if (!dragging) return // it was just a click; leave it alone
    dragging = false

    document.body.style.userSelect = ''
    document.body.style.cursor = ''

    const ui = useUIStore.getState()
    const drag = ui.drag
    ui.endDrag()
    suppressNextClick()

    if (commit && drag?.over && dropCard(cardId, drag.origin, drag.over)) {
      const title = useDomainStore.getState().cards[cardId]?.title ?? 'card'
      ui.announceDrag(
        `Dropped card "${title}", ${describeCardPosition(cardId)}.`,
      )
    }
  }

  cancelActiveDrag = cancel
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('scroll', schedule, true)
}
