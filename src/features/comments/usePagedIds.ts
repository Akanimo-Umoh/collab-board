import { useState } from 'react'

/**
 * Shows only the LAST `pageSize` ids of a chronological list, with a way to
 * reveal earlier ones. Newest-last keeps fresh comments visible without a click.
 */
export function usePagedIds(ids: readonly string[], pageSize: number) {
  const [shown, setShown] = useState(pageSize)
  const hiddenCount = Math.max(ids.length - shown, 0)
  const visibleIds = hiddenCount > 0 ? ids.slice(ids.length - shown) : ids

  return {
    visibleIds,
    hiddenCount,
    showEarlier: () => setShown((count) => count + pageSize),
  }
}
