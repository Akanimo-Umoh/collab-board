import { startLocalNotifications } from './localNotifications'
import { startSync } from './syncEngine'
import { createWebSocketTransport } from './transport'

/**
 * Starts toasts for local actions, plus real-time sync if VITE_WS_URL is set.
 * Without a server the app stays local-only.
 */
export function startRealtime(): () => void {
  const stopNotifications = startLocalNotifications()

  const url: unknown = import.meta.env.VITE_WS_URL
  if (typeof url !== 'string' || url === '') return stopNotifications

  const transport = createWebSocketTransport(url)
  const stopSync = startSync(transport)
  transport.start()

  return () => {
    stopSync()
    transport.stop()
    stopNotifications()
  }
}
