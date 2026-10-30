import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BoardPage from '@/pages/BoardPage'
import { onLocalOperation, useDomainStore } from '@/store/domain/domainStore'
import { makeBoard } from '@/test/fixtures'
import { resetStores } from '@/test/helpers'

function renderBoard() {
  return render(
    <MemoryRouter initialEntries={['/boards/b1']}>
      <Routes>
        <Route path="boards/:boardId" element={<BoardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const columnOf = (cardId: string) =>
  useDomainStore.getState().cards[cardId]?.columnId

/** Focuses a card's drag handle and picks the card up with the keyboard. */
async function grabCard(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  const handle = screen.getByRole('button', { name: `Move card ${title}` })
  act(() => handle.focus())
  await user.keyboard(' ')
  return handle
}

beforeEach(() => {
  resetStores()
  useDomainStore.setState(makeBoard({ 'To do': ['a', 'b'], Doing: ['c'] }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('board page', () => {
  it('shows the board, its columns and their cards', () => {
    renderBoard()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Board' }),
    ).toBeInTheDocument()
    const todo = screen.getByRole('region', { name: 'To do' })
    expect(within(todo).getByText('Card a')).toBeInTheDocument()
    expect(within(todo).getByText('Card b')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Doing' })).getByText('Card c'),
    ).toBeInTheDocument()
  })
})

describe('moving a card with the keyboard', () => {
  it('picks a card up, moves it to the next column and drops it there', async () => {
    const user = userEvent.setup()
    renderBoard()

    const handle = await grabCard(user, 'Card a')
    expect(handle).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')

    expect(columnOf('a')).toBe('Doing')
    const doing = screen.getByRole('region', { name: 'Doing' })
    expect(within(doing).getByText('Card a')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'To do' })).queryByText(
        'Card a',
      ),
    ).not.toBeInTheDocument()
    expect(await screen.findByText(/Dropped card/)).toBeInTheDocument()
  })

  it('cancels with Escape and leaves the card where it was', async () => {
    const user = userEvent.setup()
    renderBoard()

    await grabCard(user, 'Card a')
    await user.keyboard('{ArrowRight}')
    expect(columnOf('a')).toBe('Doing') // a live preview while held
    await user.keyboard('{Escape}')

    expect(columnOf('a')).toBe('To do')
    expect(await screen.findByText(/Move cancelled/)).toBeInTheDocument()
  })

  it('tells other sessions only once, when the card is dropped', async () => {
    const user = userEvent.setup()
    const heard = vi.fn()
    const stop = onLocalOperation(heard)
    renderBoard()

    await grabCard(user, 'Card a')
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowDown}')
    expect(heard).not.toHaveBeenCalled() // previews stay on this device

    await user.keyboard('{Enter}')

    expect(heard).toHaveBeenCalledTimes(1)
    expect(heard.mock.calls[0]?.[0]).toMatchObject({
      type: 'card.move',
      cardId: 'a',
      toColumnId: 'Doing',
    })
    stop()
  })

  it('says so when a card cannot move any further', async () => {
    const user = userEvent.setup()
    renderBoard()

    await grabCard(user, 'Card a')
    await user.keyboard('{ArrowLeft}')

    expect(
      await screen.findByText("Can't move left any further."),
    ).toBeInTheDocument()
    expect(columnOf('a')).toBe('To do')
  })
})
