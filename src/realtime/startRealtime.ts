import { startSync } from './syncEngine'
import { createWebSocketTransport } from './transport'

/** Starts real-time sync if VITE_WS_URL is set; otherwise the app stays local-only. */
export function startRealtime(): () => void {
  const url: unknown = import.meta.env.VITE_WS_URL
  if (typeof url !== 'string' || url === '') return () => {}

  const transport = createWebSocketTransport(url)
  const stopSync = startSync(transport)
  transport.start()

  return () => {
    stopSync()
    transport.stop()
  }
}
