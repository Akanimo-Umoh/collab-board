import { useUIStore, type ConnectionState } from '@/store/ui/uiStore'

const LABELS: Record<Exclude<ConnectionState, 'disabled'>, string> = {
  online: 'Live',
  connecting: 'Connecting…',
  offline: 'Offline',
}

const DOT_CLASSES: Record<Exclude<ConnectionState, 'disabled'>, string> = {
  online: 'bg-emerald-500',
  connecting: 'bg-amber-500',
  offline: 'bg-ink-muted',
}

export function ConnectionStatus() {
  const connection = useUIStore((s) => s.connection)
  if (connection === 'disabled') return null

  return (
    <p
      role="status"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted shadow-card"
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${DOT_CLASSES[connection]}`}
      />
      {LABELS[connection]}
    </p>
  )
}
