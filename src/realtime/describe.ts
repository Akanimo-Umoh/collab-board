import type { DomainSnapshot, Operation } from './operations'

export type NoticePerspective = 'local' | 'remote'

const MAX_TITLE = 40

export function quoted(text: string): string {
  const clipped =
    text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1)}…` : text
  return `“${clipped}”`
}

/**
 * Words for what an operation did, or null when it is not worth a toast.
 * `before` is the state the operation replaced, so deleted things still have names.
 * Local messages confirm your own action; remote ones say who did what.
 */
export function describeOperation(
  op: Operation,
  before: DomainSnapshot,
  perspective: NoticePerspective,
): string | null {
  const local = perspective === 'local'
  const by = op.by
  const say = (mine: string, theirs: string) => (local ? mine : theirs)

  switch (op.type) {
    case 'board.create':
      return say(
        `Board ${quoted(op.board.title)} created.`,
        `${by} created board ${quoted(op.board.title)}.`,
      )

    case 'board.delete': {
      const board = before.boards[op.boardId]
      if (!board) return null
      return say(
        `Board ${quoted(board.title)} deleted.`,
        `${by} deleted board ${quoted(board.title)}.`,
      )
    }

    case 'column.add':
      return say(
        `Column ${quoted(op.column.title)} added.`,
        `${by} added column ${quoted(op.column.title)}.`,
      )

    case 'column.rename': {
      const column = before.columns[op.columnId]
      if (!column || local) return null
      return `${by} renamed column ${quoted(column.title)} to ${quoted(op.title)}.`
    }

    case 'column.delete': {
      const column = before.columns[op.columnId]
      if (!column) return null
      return say(
        `Column ${quoted(column.title)} deleted.`,
        `${by} deleted column ${quoted(column.title)}.`,
      )
    }

    case 'card.create':
      return say(
        `Card ${quoted(op.card.title)} created.`,
        `${by} added card ${quoted(op.card.title)}.`,
      )

    case 'card.update': {
      const card = before.cards[op.cardId]
      if (!card) return null
      const title = quoted(op.patch.title ?? card.title)
      return say(`Card ${title} saved.`, `${by} edited card ${title}.`)
    }

    case 'card.move': {
      const card = before.cards[op.cardId]
      const to = before.columns[op.toColumnId]
      if (!card || !to || local) return null // you can see your own drag
      return card.columnId === op.toColumnId
        ? `${by} reordered card ${quoted(card.title)}.`
        : `${by} moved card ${quoted(card.title)} to ${quoted(to.title)}.`
    }

    case 'card.delete': {
      const card = before.cards[op.cardId]
      if (!card) return null
      return say(
        `Card ${quoted(card.title)} deleted.`,
        `${by} deleted card ${quoted(card.title)}.`,
      )
    }

    case 'comment.add': {
      const card = before.cards[op.comment.cardId]
      if (!card || local) return null
      return op.comment.parentId
        ? `${by} replied to a comment on ${quoted(card.title)}.`
        : `${by} commented on ${quoted(card.title)}.`
    }

    case 'comment.edit':
    case 'comment.delete':
      return null
  }
}
