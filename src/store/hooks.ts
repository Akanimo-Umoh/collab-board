import { useDomainStore } from './domain/domainStore'

// Each hook returns an existing object from the store, never a freshly built one, so a component re-renders only when the entity it reads actually changes.
export const useBoardOrder = () => useDomainStore((s) => s.boardOrder)
export const useBoard = (id: string) => useDomainStore((s) => s.boards[id])
export const useColumn = (id: string) => useDomainStore((s) => s.columns[id])
export const useCard = (id: string) => useDomainStore((s) => s.cards[id])
export const useComment = (id: string) => useDomainStore((s) => s.comments[id])

// One shared empty array: a fresh `[]` per call would look like a change every time.
const NO_IDS: string[] = []

/** Child ids of a card (its top-level comments) or of a comment (its replies). */
export const useReplyIds = (parentKey: string) =>
  useDomainStore((s) => s.commentChildren[parentKey] ?? NO_IDS)
