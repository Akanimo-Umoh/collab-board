import { WebSocketServer, type WebSocket } from 'ws'
import { applyOperation, type DomainSnapshot } from '../src/realtime/operations'
import {
  isEmptySnapshot,
  parseClientMessage,
  type ServerMessage,
} from '../src/realtime/protocol'

const PORT = Number(process.env.PORT ?? 8787)
const MAX_PAYLOAD_BYTES = 1024 * 1024
const MAX_REMEMBERED_OPS = 5000
const HEARTBEAT_MS = 30_000

/* The authoritative state lives in memory: restarting the server resets it (the first client to reconnect seeds it again). */
let state: DomainSnapshot = {
  boardOrder: [],
  boards: {},
  columns: {},
  cards: {},
}
let rev = 0

/* Recently seen operation IDs. A client that reconnects re-sends anything it never got an acknowledgement for; this keeps that harmless. */
const seenOpIds = new Set<string>()

function remember(opId: string): void {
  seenOpIds.add(opId)
  if (seenOpIds.size > MAX_REMEMBERED_OPS) {
    const oldest = seenOpIds.values().next().value
    if (oldest !== undefined) seenOpIds.delete(oldest)
  }
}

const wss = new WebSocketServer({ port: PORT, maxPayload: MAX_PAYLOAD_BYTES })

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
}

function broadcast(message: ServerMessage): void {
  for (const client of wss.clients) send(client, message)
}

wss.on('connection', (socket) => {
  alive.add(socket)
  socket.on('pong', () => alive.add(socket))
  console.log(`client connected (${wss.clients.size} online)`)

  socket.on('message', (data) => {
    const message = parseClientMessage(data.toString())
    if (!message) return

    if (message.type === 'hello') {
      if (
        rev === 0 &&
        isEmptySnapshot(state) &&
        message.seed &&
        !isEmptySnapshot(message.seed)
      ) {
        state = message.seed
        rev = 1
        broadcast({ type: 'snapshot', rev, state }) // everyone, including late joiners
        return
      }
      send(socket, { type: 'snapshot', rev, state })
      return
    }

    // message.type === 'op'
    const { op } = message
    if (seenOpIds.has(op.opId)) {
      send(socket, { type: 'noop', opId: op.opId })
      return
    }
    remember(op.opId)

    let next = state
    try {
      next = applyOperation(state, op)
    } catch {
      // Malformed operation: treat as a no-op rather than crashing the server.
    }

    if (next === state) {
      send(socket, { type: 'noop', opId: op.opId })
      return
    }

    state = next
    rev += 1
    broadcast({ type: 'op', rev, op })
  })

  socket.on('close', () => {
    console.log(`client left (${wss.clients.size} online)`)
  })
})

/* Drop connections that stopped answering pings (closed laptops, dead networks). */
const alive = new WeakSet<WebSocket>()
setInterval(() => {
  for (const socket of wss.clients) {
    if (!alive.has(socket)) {
      socket.terminate()
      continue
    }
    alive.delete(socket)
    socket.ping()
  }
}, HEARTBEAT_MS)

console.log(`CollabBoard realtime server listening on ws://localhost:${PORT}`)
