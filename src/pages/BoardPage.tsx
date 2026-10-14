import { useParams } from 'react-router-dom'
import { useBoard } from '@/store/hooks'
import NotFoundPage from './NotFoundPage'

export default function BoardPage() {
  const { boardId = '' } = useParams()
  const board = useBoard(boardId)

  if (!board) {
    return (
      <NotFoundPage
        heading="Board not found"
        message="This board doesn't exist or may have been deleted."
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {board.title}
      </h1>
    </div>
  )
}
