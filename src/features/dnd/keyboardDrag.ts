import type { KeyboardEvent } from 'react'
import { getKeyboardTarget, type MoveDirection } from '@/lib/ordering'
import { useDomainStore } from '@/store/domain/domainStore'
import { useUIStore } from '@/store/ui/uiStore'
import type { ID } from '@/types/domain'
import { describeCardPosition, getCardPosition } from './positions'

function toDirection(key: string): MoveDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    default:
      return null
  }
}

const cardTitle = (cardId: ID) =>
  useDomainStore.getState().cards[cardId]?.title ?? 'card'

/** Moving across columns remounts the card, so focus has to be handed back. */
function focusHandle(cardId: ID): void {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-card-handle="${cardId}"]`)
      ?.focus()
  })
}

/** Keeps the moved card visible inside its scrolling column (and the board). */
function revealCard(cardId: ID): void {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-card-id="${cardId}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}

function grab(cardId: ID): void {
  const origin = getCardPosition(cardId)
  if (!origin) return
  const ui = useUIStore.getState()
  ui.startDrag({ cardId, mode: 'keyboard', origin, over: null, preview: null })
  ui.announceDrag(
    `Picked up card "${cardTitle(cardId)}", ${describeCardPosition(cardId)}. Use the arrow keys to move it, Space to drop it, Escape to cancel.`,
  )
}

/** A local preview only: other sessions must not watch the card hop with every key press. */
function move(cardId: ID, direction: MoveDirection): void {
  const ui = useUIStore.getState()
  const target = getKeyboardTarget(useDomainStore.getState(), cardId, direction)
  if (!target) {
    ui.announceDrag(`Can't move ${direction} any further.`)
    return
  }
  useDomainStore
    .getState()
    .moveCard(cardId, target.columnId, target.index, { local: true })
  ui.announceDrag(`Moved to ${describeCardPosition(cardId)}.`)
  revealCard(cardId)
}

function drop(cardId: ID): void {
  const ui = useUIStore.getState()
  const drag = ui.drag
  const to = getCardPosition(cardId)
  ui.endDrag()
  if (!drag || !to) return

  const changed =
    drag.origin.columnId !== to.columnId || drag.origin.index !== to.index

  if (changed) {
    // Put the card back (silently), then perform the move once for real, so other sessions receive ONE operation. Both happen in the same event, so React batches them: no flicker.
    const domain = useDomainStore.getState()
    domain.moveCard(cardId, drag.origin.columnId, drag.origin.index, {
      local: true,
    })
    domain.moveCard(cardId, to.columnId, to.index)
    ui.announceDrag(
      `Dropped card "${cardTitle(cardId)}", ${describeCardPosition(cardId)}.`,
    )
  } else {
    ui.announceDrag(`Dropped card "${cardTitle(cardId)}". Position unchanged.`)
  }
  focusHandle(cardId)
}

/** Nothing was sent while grabbed, so cancelling only restores the local preview. */
export function cancelKeyboardDrag(cardId: ID, restoreFocus = true): void {
  const ui = useUIStore.getState()
  const drag = ui.drag
  if (!drag || drag.mode !== 'keyboard' || drag.cardId !== cardId) return

  useDomainStore
    .getState()
    .moveCard(cardId, drag.origin.columnId, drag.origin.index, { local: true })
  ui.endDrag()
  ui.announceDrag(
    `Move cancelled. Card "${cardTitle(cardId)}" is back in ${describeCardPosition(cardId)}.`,
  )
  if (restoreFocus) focusHandle(cardId)
}

export function handleHandleKeyDown(
  event: KeyboardEvent<HTMLElement>,
  cardId: ID,
): void {
  const drag = useUIStore.getState().drag
  const grabbed = drag?.mode === 'keyboard' && drag.cardId === cardId

  if (!grabbed) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      grab(cardId)
    }
    return
  }

  const direction = toDirection(event.key)
  if (direction) {
    event.preventDefault() // don't scroll the page while moving a card
    move(cardId, direction)
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    drop(cardId)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancelKeyboardDrag(cardId)
  }
}

/** Tabbing or clicking away cancels the grab, unless the handle was just remounted. */
export function handleHandleBlur(cardId: ID): void {
  requestAnimationFrame(() => {
    const active = document.activeElement
    const stillOnHandle =
      active instanceof HTMLElement && active.dataset.cardHandle === cardId
    if (!stillOnHandle) cancelKeyboardDrag(cardId, false)
  })
}
