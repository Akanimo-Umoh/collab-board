const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

/** Formats an ISO timestamp for display, in the user's locale. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}
