import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedJSONStorage } from './debouncedStorage'

interface Saved {
  n: number
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createDebouncedJSONStorage', () => {
  it('writes once, after changes have stopped, with the latest value', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const storage = createDebouncedJSONStorage<Saved>(300)

    storage.setItem('k', { state: { n: 1 } })
    storage.setItem('k', { state: { n: 2 } })
    storage.setItem('k', { state: { n: 3 } })
    expect(write).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)

    expect(write).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual({
      state: { n: 3 },
    })
  })

  it('serves the pending value before it has been written', () => {
    const storage = createDebouncedJSONStorage<Saved>(300)

    storage.setItem('k', { state: { n: 7 } })

    expect(storage.getItem('k')).toEqual({ state: { n: 7 } })
  })

  it('reads what an earlier visit saved', () => {
    localStorage.setItem('k', JSON.stringify({ state: { n: 42 }, version: 0 }))
    const storage = createDebouncedJSONStorage<Saved>()

    expect(storage.getItem('k')).toEqual({ state: { n: 42 }, version: 0 })
  })

  it('returns null when nothing (or something unreadable) is stored', () => {
    const storage = createDebouncedJSONStorage<Saved>()
    expect(storage.getItem('missing')).toBeNull()

    localStorage.setItem('broken', '{not json')
    expect(storage.getItem('broken')).toBeNull()
  })

  it('saves immediately when the tab is being hidden, so nothing is lost', () => {
    const storage = createDebouncedJSONStorage<Saved>(300)
    storage.setItem('k', { state: { n: 9 } })

    window.dispatchEvent(new Event('pagehide'))

    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual({
      state: { n: 9 },
    })
  })

  it('removeItem drops both the pending and the stored value', () => {
    localStorage.setItem('k', JSON.stringify({ state: { n: 1 } }))
    const storage = createDebouncedJSONStorage<Saved>(300)
    storage.setItem('k', { state: { n: 2 } })

    storage.removeItem('k')
    vi.advanceTimersByTime(300)

    expect(localStorage.getItem('k')).toBeNull()
  })
})
