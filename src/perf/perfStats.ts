import type { ProfilerOnRenderCallback } from 'react'

/** The performance lab is opt-in: add ?perf to a board's URL. */
export const isPerfLabEnabled = (): boolean =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('perf')

const stats = { commits: 0, actualMs: 0 }

/** React only calls this in the development build. */
export const recordRender: ProfilerOnRenderCallback = (
  _id,
  _phase,
  actualDuration,
) => {
  stats.commits += 1
  stats.actualMs += actualDuration
}

export const readRenderStats = () => ({ ...stats })

export const resetRenderStats = () => {
  stats.commits = 0
  stats.actualMs = 0
}
