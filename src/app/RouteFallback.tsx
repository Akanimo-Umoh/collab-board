export function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-[40dvh] items-center justify-center gap-3 text-sm text-ink-muted"
    >
      <span
        aria-hidden="true"
        className="size-4 rounded-full border-2 border-border border-t-brand-500 motion-safe:animate-spin"
      />
      Loading…
    </div>
  )
}
