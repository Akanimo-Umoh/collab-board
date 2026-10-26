import type { CardPosition } from '@/lib/ordering'
import { useDomainStore } from '@/store/domain/domainStore'
import type { ID } from '@/types/domain'

export function getCardPosition(cardId: ID): CardPosition | null {
  const { cards, columns } = useDomainStore.getState()
  const card = cards[cardId]
  if (!card) return null
  const column = columns[card.columnId]
  if (!column) return null
  return { columnId: column.id, index: column.cardIds.indexOf(cardId) }
}

/** Human-readable position for screen reader announcements. */
export function describeCardPosition(cardId: ID): string {
  const { cards, columns } = useDomainStore.getState()
  const card = cards[cardId]
  if (!card) return ''
  const column = columns[card.columnId]
  if (!column) return ''
  const position = column.cardIds.indexOf(cardId) + 1
  return `column ${column.title}, position ${position} of ${column.cardIds.length}`
}
