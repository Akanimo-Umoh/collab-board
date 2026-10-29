import { startHistory } from '@/history/startHistory'
import { startSync } from './syncEngine'
import { createWebSocketTransport } from './transport'
import { useUIStore } from '@/store/ui/uiStore'

/**
 * Starts undo history and local-action toasts, plus real-time sync if
 * VITE_WS_URL is set. Without a server the app stays local-only.
 */
export function startRealtime(): () => void {
  const stopHistory = startHistory()

  const url: unknown = import.meta.env.VITE_WS_URL
  if (typeof url !== 'string' || url === '') {
    useUIStore.getState().finishInitialSync() // local-only: nothing to wait for
    return stopHistory
  }

  const transport = createWebSocketTransport(url)
  const stopSync = startSync(transport)
  transport.start()

  return () => {
    stopSync()
    transport.stop()
    stopHistory()
  }
}
