import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useDomainStore } from '@/store/domain/domainStore'
import { useToastStore } from '@/store/ui/toastStore'
import type { CardInput } from '@/types/domain'
import { must } from '@/test/fixtures'
import { resetStores } from '@/test/helpers'
import { useHistoryStore, withoutHistory } from './historyStore'
import { startHistory } from './startHistory'

const domain = () => useDomainStore.getState()
const history = () => useHistoryStore.getState()
const input = (title: string): CardInput => ({
  title,
  description: '',
  tags: [],
  dueDate: null,
})

let columnId = ''
let stop: () => void = () => {}

beforeEach(() => {
  resetStores()
  const boardId = domain().createBoard({ title: 'Board', description: '' })
  columnId = must(domain().addColumn(boardId, 'To do'))
  stop = startHistory()
})

afterEach(() => {
  stop()
})

describe('undo and redo', () => {
  it('records an entry for a new card', () => {
    domain().addCard(columnId, input('Write tests'))

    expect(history().undoStack).toHaveLength(1)
    expect(history().undoStack[0].label).toContain('Write tests')
  })

  it('undo removes the card and redo brings it back', () => {
    const cardId = must(domain().addCard(columnId, input('Write tests')))

    history().undo()
    expect(domain().cards[cardId]).toBeUndefined()
    expect(history().undoStack).toHaveLength(0)
    expect(history().redoStack).toHaveLength(1)

    history().redo()
    expect(domain().cards[cardId]?.title).toBe('Write tests')
    expect(history().undoStack).toHaveLength(1)
    expect(history().redoStack).toHaveLength(0)
  })

  it('a new action clears what could have been redone', () => {
    domain().addCard(columnId, input('First'))
    history().undo()
    expect(history().redoStack).toHaveLength(1)

    domain().addCard(columnId, input('Second'))
    expect(history().redoStack).toHaveLength(0)
  })

  it('does nothing when there is nothing to undo or redo', () => {
    history().undo()
    history().redo()

    expect(history().undoStack).toHaveLength(0)
    expect(history().redoStack).toHaveLength(0)
  })

  it('undoing a delete brings back the card with its comments', () => {
    const cardId = must(domain().addCard(columnId, input('Discussed')))
    domain().addComment(cardId, null, 'hello')
    domain().deleteCard(cardId)
    expect(domain().comments).toEqual({})

    history().undo()

    expect(domain().cards[cardId]).toBeDefined()
    const [commentId] = domain().commentChildren[cardId] ?? []
    expect(domain().comments[commentId]?.body).toBe('hello')
  })

  it('keeps only the most recent 100 entries', () => {
    for (let i = 0; i < 105; i += 1)
      domain().addCard(columnId, input(`Card ${i}`))

    expect(history().undoStack).toHaveLength(100)
    expect(history().undoStack[0].label).toContain('Card 5')
  })
})

describe('when someone else changed things in the meantime', () => {
  it('fails honestly and drops the entry', () => {
    const cardId = must(domain().addCard(columnId, input('Doomed')))
    // A teammate deletes it; this is not our own action, so it is not recorded.
    withoutHistory(() => domain().deleteCard(cardId))

    history().undo()

    expect(history().undoStack).toHaveLength(0)
    expect(history().redoStack).toHaveLength(0)
    expect(
      useToastStore.getState().toasts.some((t) => t.tone === 'error'),
    ).toBe(true)
  })
})

describe('the Undo button on the delete toast', () => {
  it('restores the card when it is still the latest action', () => {
    const cardId = must(domain().addCard(columnId, input('Oops')))
    domain().deleteCard(cardId)

    const toast = useToastStore
      .getState()
      .toasts.find((t) => t.action?.label === 'Undo')
    toast?.action?.onAction()

    expect(domain().cards[cardId]?.title).toBe('Oops')
  })

  it('does not undo an older entry out of order', () => {
    const first = must(domain().addCard(columnId, input('First')))
    domain().addCard(columnId, input('Second'))
    const firstEntryId = history().undoStack[0].id

    history().undoEntry(firstEntryId)

    expect(domain().cards[first]).toBeDefined()
    expect(history().undoStack).toHaveLength(2)
  })
})
