export type ID = string

export interface Board {
  id: ID
  title: string
  description: string
  createdAt: string
  columnIds: ID[]
}

export interface Column {
  id: ID
  boardId: ID
  title: string
  cardIds: ID[]
}

export interface Card {
  id: ID
  columnId: ID
  title: string
  description: string
  tags: string[]
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type BoardInput = Pick<Board, 'title' | 'description'>
export type CardInput = Pick<Card, 'title' | 'description' | 'tags' | 'dueDate'>
