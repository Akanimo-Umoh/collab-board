import { boardApi } from '@/api/boardApi'
import type { CardPosition } from '@/lib/ordering'
import { useDomainStore } from '@/store/domain/domainStore'
import { useUIStore } from '@/store/ui/uiStore'
import type { ID } from '@/types/domain'

/**
 * Persist a move that is already applied in the store (optimistic update).
 * On failure, put the card back where it started.
 * Rollback is best-effort for now: Stage 2's reconciliation will replace it with server-authoritative state.
 */
export async function syncMove(
  cardId: ID,
  from: CardPosition,
  to: CardPosition,
): Promise<void> {
  try {
    await boardApi.moveCard({ cardId, from, to })
  } catch {
    useDomainStore.getState().moveCard(cardId, from.columnId, from.index)
    useUIStore
      .getState()
      .announceDrag(
        'Could not save the move. The card was returned to its previous position.',
      )
  }
}

/** Apply a move optimistically, then persist it. Returns false for a no-op. */
export function dropCard(
  cardId: ID,
  from: CardPosition,
  to: CardPosition,
): boolean {
  const moved = useDomainStore
    .getState()
    .moveCard(cardId, to.columnId, to.index)
  if (moved) void syncMove(cardId, from, to)
  return moved
}
