import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import BoardPage from '@/pages/BoardPage'
import { useDomainStore } from '@/store/domain/domainStore'
import { makeBoard, makeComment, withComments } from '@/test/fixtures'
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

async function openCard(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await user.click(screen.getByRole('button', { name: title }))
  return screen.findByRole('dialog', { name: title })
}

beforeEach(() => {
  resetStores()
})

describe('comment thread in the card dialog', () => {
  beforeEach(() => {
    useDomainStore.setState(makeBoard({ todo: ['a'] }))
  })

  it('adds a comment, replies to it, edits it, and deletes it', async () => {
    const user = userEvent.setup()
    renderBoard()
    const dialog = within(await openCard(user, 'Card a'))

    // Add
    expect(dialog.getByText(/No comments yet/)).toBeInTheDocument()
    await user.type(
      dialog.getByRole('textbox', { name: 'Add a comment' }),
      'Looks good',
    )
    await user.click(dialog.getByRole('button', { name: 'Comment' }))
    expect(await dialog.findByText('Looks good')).toBeInTheDocument()

    // Reply (the second level)
    await user.click(
      dialog.getByRole('button', { name: /^Reply to .+: Looks good$/ }),
    )
    await user.type(
      dialog.getByRole('textbox', { name: /^Reply to / }),
      'Thanks',
    )
    await user.click(dialog.getByRole('button', { name: 'Reply' }))
    expect(await dialog.findByText('Thanks')).toBeInTheDocument()
    expect(
      dialog.getByRole('button', { name: 'Hide replies (1)' }),
    ).toBeInTheDocument()

    // Edit
    await user.click(
      dialog.getByRole('button', { name: 'Edit your comment: Looks good' }),
    )
    const editor = dialog.getByRole('textbox', { name: 'Edit your comment' })
    await user.clear(editor)
    await user.type(editor, 'Looks great')
    await user.click(dialog.getByRole('button', { name: 'Save' }))
    expect(await dialog.findByText('Looks great')).toBeInTheDocument()
    expect(dialog.queryByText('Looks good')).not.toBeInTheDocument()

    // Delete: the reply stays, under a tombstone
    await user.click(
      dialog.getByRole('button', { name: 'Delete your comment: Looks great' }),
    )
    const confirm = within(
      dialog.getByRole('group', { name: 'Confirm delete' }),
    )
    await user.click(confirm.getByRole('button', { name: 'Delete' }))
    expect(
      await dialog.findByText('This comment was deleted.'),
    ).toBeInTheDocument()
    expect(dialog.getByText('Thanks')).toBeInTheDocument()
  })
})

describe('large threads', () => {
  it('shows the latest 30 comments and reveals earlier ones on request', async () => {
    const user = userEvent.setup()
    const comments = Array.from({ length: 40 }, (_, i) =>
      makeComment(`c${i}`, 'a'),
    )
    useDomainStore.setState(withComments(makeBoard({ todo: ['a'] }), comments))
    renderBoard()
    const dialog = within(await openCard(user, 'Card a'))

    expect(dialog.getByText('Comment c39')).toBeInTheDocument()
    expect(dialog.getByText('Comment c10')).toBeInTheDocument()
    expect(dialog.queryByText('Comment c9')).not.toBeInTheDocument()

    await user.click(
      dialog.getByRole('button', { name: /Show 10 earlier comments/ }),
    )

    expect(dialog.getByText('Comment c0')).toBeInTheDocument()
    expect(
      dialog.queryByRole('button', { name: /earlier comments/ }),
    ).not.toBeInTheDocument()
  })
})
