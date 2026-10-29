import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'collabboard:theme'

/** index.html sets data-theme before the first paint; this only reads it. */
function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()((set, get) => ({
  theme: readTheme(),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
    set({ theme: next })
  },
}))
