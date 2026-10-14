import { useDomainStore } from './domain/domainStore'

// Each hook returns an existing object from the store, never a freshly built one, so a component re-renders only when the entity it reads actually changes.
export const useBoardOrder = () => useDomainStore((s) => s.boardOrder)
export const useBoard = (id: string) => useDomainStore((s) => s.boards[id])
export const useColumn = (id: string) => useDomainStore((s) => s.columns[id])
export const useCard = (id: string) => useDomainStore((s) => s.cards[id])
