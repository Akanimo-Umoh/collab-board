/** Returns a copy of `record` without `key`, leaving the original untouched. */
export function withoutKey<T>(
  record: Record<string, T>,
  key: string,
): Record<string, T> {
  const next = { ...record }
  delete next[key]
  return next
}
