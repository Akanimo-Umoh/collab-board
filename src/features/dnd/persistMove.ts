import type { CardPosition } from '@/lib/ordering'
import { useDomainStore } from '@/store/domain/domainStore'
import type { ID } from '@/types/domain'

/**
 * Applies a drop. The store turns it into an operation; the sync engine delivers it and reconciles with the server. Returns false for a no-op.
 */
export function dropCard(cardId: ID, to: CardPosition): boolean {
  return useDomainStore.getState().moveCard(cardId, to.columnId, to.index)
}
