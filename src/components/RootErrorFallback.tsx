import { Button } from '@/components/ui/Button'

export function RootErrorFallback() {
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-xl font-semibold text-ink">
        CollabBoard hit a problem
      </h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Reloading usually fixes it. Your boards are saved on this device.
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  )
}
