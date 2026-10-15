export const TAG_MAX_LENGTH = 20
export const TAG_MAX_COUNT = 8

/** Trims, strips leading #, collapses spaces, and caps the length. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TAG_MAX_LENGTH)
}

/** Case-insensitive membership check, so "Bug" and "bug" count as the same tag. */
export function hasTag(tags: readonly string[], tag: string): boolean {
  const lower = tag.toLowerCase()
  return tags.some((existing) => existing.toLowerCase() === lower)
}
