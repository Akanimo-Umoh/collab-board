import type { PersistStorage, StorageValue } from 'zustand/middleware'

const WRITE_DELAY_MS = 300

/**
 * localStorage for Zustand's persist, with writes deferred and merged.
 *
 * The default storage serializes the entire state to JSON on EVERY store change. This one keeps only the latest state object in memory and serializes once, after changes have stopped for `delay` ms (and when the tab is hidden or closed, so nothing is lost).
 */
export function createDebouncedJSONStorage<S>(
  delay = WRITE_DELAY_MS,
): PersistStorage<S> {
  const queued = new Map<string, StorageValue<S>>()
  let timer: ReturnType<typeof setTimeout> | undefined

  function flush(): void {
    clearTimeout(timer)
    timer = undefined
    for (const [name, value] of queued) {
      try {
        localStorage.setItem(name, JSON.stringify(value))
      } catch {
        // Quota exceeded or storage blocked: the app keeps working from memory.
      }
    }
    queued.clear()
  }

  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })

  return {
    getItem: (name) => {
      const waiting = queued.get(name)
      if (waiting) return waiting
      try {
        const raw = localStorage.getItem(name)
        return raw === null ? null : (JSON.parse(raw) as StorageValue<S>)
      } catch {
        return null
      }
    },

    setItem: (name, value) => {
      queued.set(name, value)
      clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },

    removeItem: (name) => {
      queued.delete(name)
      try {
        localStorage.removeItem(name)
      } catch {
        // Nothing to remove if storage is blocked.
      }
    },
  }
}
