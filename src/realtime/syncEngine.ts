import { onLocalOperation, useDomainStore } from '@/store/domain/domainStore'
import { useUIStore } from '@/store/ui/uiStore'
import {
  applyOperation,
  type DomainSnapshot,
  type Operation,
} from './operations'
import type { Transport } from './transport'

const toSnapshot = (s: DomainSnapshot): DomainSnapshot => ({
  boardOrder: s.boardOrder,
  boards: s.boards,
  columns: s.columns,
  cards: s.cards,
})

/**
 * Client-side prediction with server reconciliation.
 *
 *   confirmed  what the server has told us so far (its operations, in its order)
 *   pending    our own operations the server has not acknowledged yet
 *   on screen  confirmed + pending replayed on top
 */
export function startSync(transport: Transport): () => void {
  let confirmed: DomainSnapshot | null = null
  let rev = 0
  let pending: Operation[] = []
  let synced = false // true once a snapshot arrived on the current connection

  const setConnection = useUIStore.getState().setConnection
  setConnection('offline')

  /** Rebuild what the user sees. Entities untouched by `pending` keep their references. */
  function showOptimistic(): void {
    if (!confirmed) return
    useDomainStore.setState(pending.reduce(applyOperation, confirmed))
  }

  function sendPending(): void {
    pending.forEach((op) => transport.send({ type: 'op', op }))
  }

  function resync(): void {
    synced = false
    transport.send({ type: 'hello', seed: null })
  }

  const offLocal = onLocalOperation((op) => {
    pending = [...pending, op]
    if (synced) transport.send({ type: 'op', op })
    // Not synced yet: it waits in `pending` and goes out right after the next snapshot.
  })

  const offStatus = transport.onStatus((status) => {
    synced = false
    if (status === 'open') {
      setConnection('connecting') // "online" once the snapshot arrives
      // The seed only matters if the server is empty (first client in, or it restarted).
      transport.send({
        type: 'hello',
        seed: confirmed ?? toSnapshot(useDomainStore.getState()),
      })
    } else {
      setConnection(status === 'connecting' ? 'connecting' : 'offline')
    }
  })

  const offMessage = transport.onMessage((message) => {
    switch (message.type) {
      case 'snapshot': {
        confirmed = message.state
        rev = message.rev
        synced = true
        showOptimistic()
        sendPending() // anything the server never acknowledged; it ignores duplicates
        setConnection('online')
        return
      }

      case 'op': {
        if (!synced || !confirmed) return // the next snapshot will cover it
        if (message.rev <= rev) return // already have it
        if (message.rev > rev + 1) {
          resync() // we missed something
          return
        }

        confirmed = applyOperation(confirmed, message.op)
        rev = message.rev

        const isOwn = pending.some((p) => p.opId === message.op.opId)
        if (isOwn) {
          // Our own operation, acknowledged. The screen already shows
          // confirmed + pending, which now equals the new confirmed state,
          // so only the bookkeeping changes: no store write, no re-render.
          pending = pending.filter((p) => p.opId !== message.op.opId)
        } else {
          showOptimistic() // someone else's change: replay ours on top
        }
        return
      }

      case 'noop': {
        const hadEffect = pending.some((p) => p.opId === message.opId)
        pending = pending.filter((p) => p.opId !== message.opId)
        if (hadEffect) showOptimistic() // roll back its optimistic effect
        return
      }
    }
  })

  return () => {
    offLocal()
    offStatus()
    offMessage()
  }
}
