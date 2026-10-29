/**
 * Index at which a dragged card would be inserted, found by binary search
 * over items ordered top to bottom. `midpointAt(i)` is read lazily, so
 * callers measure the DOM only for the handful of items the search visits.
 */
export function findInsertIndex(
  count: number,
  midpointAt: (index: number) => number,
  pointerY: number,
): number {
  let low = 0
  let high = count
  while (low < high) {
    const mid = (low + high) >>> 1
    if (pointerY > midpointAt(mid)) low = mid + 1
    else high = mid
  }
  return low
}

/** Same, for a plain list of midpoints (handy for tests). */
export function getInsertIndex(
  midpoints: readonly number[],
  pointerY: number,
): number {
  return findInsertIndex(midpoints.length, (i) => midpoints[i], pointerY)
}

/**
 * Scroll speed (px per frame) for a pointer near the edges of a scroll area.
 * Negative scrolls toward `start`, positive toward `end`, 0 in the middle.
 * Speed grows as the pointer gets closer to (or beyond) the edge.
 */
export function getEdgeScrollDelta(
  pointer: number,
  start: number,
  end: number,
  edgeSize = 64,
  maxSpeed = 18,
): number {
  const fromStart = pointer - start
  const fromEnd = end - pointer

  if (fromStart < edgeSize) {
    return -Math.round(maxSpeed * (1 - Math.max(fromStart, 0) / edgeSize))
  }
  if (fromEnd < edgeSize) {
    return Math.round(maxSpeed * (1 - Math.max(fromEnd, 0) / edgeSize))
  }
  return 0
}
