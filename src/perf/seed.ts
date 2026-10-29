import { createId } from '@/lib/id'
import type { OperationInput } from '@/realtime/operations'
import type { Card, CardComment, Column, ID } from '@/types/domain'

/** Seeded columns are named with this prefix so they can be removed again. */
export const SEED_PREFIX = 'Perf '

export interface SeedConfig {
  boardId: ID
  columns: number
  cardsPerColumn: number
  /** Cards that receive a deep comment thread. */
  hotCards: number
  commentsPerHotCard: number
}

const TAGS = ['design', 'bug', 'frontend', 'api', 'urgent', 'research']
const AUTHORS = [
  { id: 'seed-ada', name: 'Ada' },
  { id: 'seed-bola', name: 'Bola' },
  { id: 'seed-chidi', name: 'Chidi' },
]
const MAX_REPLY_DEPTH = 4

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function buildSeedOperations(config: SeedConfig): OperationInput[] {
  const ops: OperationInput[] = []
  const now = new Date().toISOString()
  const cards: Card[] = []

  for (let c = 1; c <= config.columns; c += 1) {
    const column: Column = {
      id: createId(),
      boardId: config.boardId,
      title: `${SEED_PREFIX}column ${c}`,
      cardIds: [],
    }
    ops.push({ type: 'column.add', column })

    for (let n = 1; n <= config.cardsPerColumn; n += 1) {
      const card: Card = {
        id: createId(),
        columnId: column.id,
        title: `Task ${c}.${n}: ${pick(['Review', 'Fix', 'Design', 'Ship', 'Plan'])} ${pick(['login', 'billing', 'search', 'profile', 'export'])}`,
        description: 'Seeded for the performance lab.',
        tags: TAGS.filter(() => Math.random() < 0.3),
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      }
      cards.push(card)
      ops.push({ type: 'card.create', card })
    }
  }

  // Spread the "hot" cards across the board instead of piling them in one column.
  const step = Math.max(
    1,
    Math.floor(cards.length / Math.max(config.hotCards, 1)),
  )
  const hot = cards.filter((_, i) => i % step === 0).slice(0, config.hotCards)

  for (const card of hot) {
    const thread: { id: ID; depth: number }[] = []
    for (let i = 0; i < config.commentsPerHotCard; i += 1) {
      const candidates = thread.filter((t) => t.depth < MAX_REPLY_DEPTH)
      const parent =
        candidates.length > 0 && Math.random() < 0.7 ? pick(candidates) : null
      const author = pick(AUTHORS)
      const comment: CardComment = {
        id: createId(),
        cardId: card.id,
        parentId: parent ? parent.id : null,
        authorId: author.id,
        authorName: author.name,
        body: `Seeded comment ${i + 1} on this card.`,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      }
      thread.push({ id: comment.id, depth: parent ? parent.depth + 1 : 0 })
      ops.push({ type: 'comment.add', comment })
    }
  }

  return ops
}

/** Deleting a seeded column also deletes its cards and their comments. */
export function buildCleanupOperations(
  columns: Record<ID, Column>,
  boardId: ID,
): OperationInput[] {
  return Object.values(columns)
    .filter((c) => c.boardId === boardId && c.title.startsWith(SEED_PREFIX))
    .map((c): OperationInput => ({ type: 'column.delete', columnId: c.id }))
}
