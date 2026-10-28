import { create } from 'zustand'

interface AnnouncerStore {
  message: string
  announce: (message: string) => void
}

export const useAnnouncerStore = create<AnnouncerStore>()((set) => ({
  message: '',
  // Clearing first makes screen readers speak a repeated message again.
  announce: (message) => {
    set({ message: '' })
    setTimeout(() => set({ message }), 50)
  },
}))
