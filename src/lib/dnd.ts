/**
 * Index at which a dragged card would be inserted, given the vertical midpoints (top to bottom) of the OTHER cards in the column.
 */
export function getInsertIndex(
  midpoints: readonly number[],
  pointerY: number,
): number {
  let index = 0
  for (const midpoint of midpoints) {
    if (pointerY <= midpoint) break
    index += 1
  }
  return index
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
