import {
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
} from './protocol'

export type TransportStatus = 'connecting' | 'open' | 'closed'

/** Everything the sync engine knows about the network. Swap the implementation, keep the engine. */
export interface Transport {
  start: () => void
  stop: () => void
  /** False when the connection is not open (the engine keeps the operation queued). */
  send: (message: ClientMessage) => boolean
  onMessage: (handler: (message: ServerMessage) => void) => () => void
  onStatus: (handler: (status: TransportStatus) => void) => () => void
}

const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 10_000

export function createWebSocketTransport(url: string): Transport {
  const messageHandlers = new Set<(message: ServerMessage) => void>()
  const statusHandlers = new Set<(status: TransportStatus) => void>()
  let socket: WebSocket | null = null
  let status: TransportStatus = 'closed'
  let stopped = true
  let attempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined

  function setStatus(next: TransportStatus): void {
    if (next === status) return
    status = next
    statusHandlers.forEach((handler) => handler(next))
  }

  function scheduleReconnect(): void {
    if (stopped) return
    const ceiling = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempts)
    attempts += 1
    // Jitter stops many clients reconnecting in lockstep after a server restart.
    reconnectTimer = setTimeout(open, ceiling * (0.5 + Math.random() / 2))
  }

  function open(): void {
    if (stopped) return
    setStatus('connecting')

    const ws = new WebSocket(url)
    socket = ws

    ws.onopen = () => {
      attempts = 0
      setStatus('open')
    }
    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return
      const message = parseServerMessage(event.data)
      if (message) messageHandlers.forEach((handler) => handler(message))
    }
    ws.onerror = () => ws.close()
    ws.onclose = () => {
      if (socket !== ws) return // a socket we already replaced or stopped
      socket = null
      setStatus('closed')
      scheduleReconnect()
    }
  }

  return {
    start() {
      if (!stopped) return
      stopped = false
      attempts = 0
      open()
    },

    stop() {
      stopped = true
      clearTimeout(reconnectTimer)
      const current = socket
      socket = null
      current?.close()
      setStatus('closed')
    },

    send(message) {
      const ws = socket
      if (!ws || ws.readyState !== WebSocket.OPEN) return false
      ws.send(JSON.stringify(message))
      return true
    },

    onMessage(handler) {
      messageHandlers.add(handler)
      return () => {
        messageHandlers.delete(handler)
      }
    },

    onStatus(handler) {
      statusHandlers.add(handler)
      return () => {
        statusHandlers.delete(handler)
      }
    },
  }
}
