const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

/** Formats an ISO timestamp for display, in the user's locale. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

/** Formats a date-only string (YYYY-MM-DD) without any timezone shift. */
export function formatDueDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}
