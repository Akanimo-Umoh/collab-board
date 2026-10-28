import type { DomainSnapshot, Operation } from './operations'

export type ClientMessage =
  /** `seed` is only used if the server is still empty (first client in). */
  { type: 'hello'; seed: DomainSnapshot | null } | { type: 'op'; op: Operation }

export type ServerMessage =
  | { type: 'snapshot'; rev: number; state: DomainSnapshot }
  /** An operation the server accepted, in global order. The sender receives it too (that is its acknowledgement). */
  | { type: 'op'; rev: number; op: Operation }
  /** The server changed nothing for this operation (duplicate, or it no longer applies). */
  | { type: 'noop'; opId: string }

export const isEmptySnapshot = (state: DomainSnapshot): boolean =>
  state.boardOrder.length === 0

/* Boundary validation is deliberately shallow; the server also guards applyOperation with try/catch. */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSnapshot(value: unknown): value is DomainSnapshot {
  return (
    isRecord(value) &&
    Array.isArray(value.boardOrder) &&
    isRecord(value.boards) &&
    isRecord(value.columns) &&
    isRecord(value.cards)
  )
}

function isOperation(value: unknown): value is Operation {
  return (
    isRecord(value) &&
    typeof value.opId === 'string' &&
    typeof value.type === 'string' &&
    typeof value.at === 'string'
  )
}

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    const data: unknown = JSON.parse(raw)
    return isRecord(data) ? data : null
  } catch {
    return null
  }
}

export function parseClientMessage(raw: string): ClientMessage | null {
  const data = parseJson(raw)
  if (!data) return null

  if (data.type === 'hello') {
    return { type: 'hello', seed: isSnapshot(data.seed) ? data.seed : null }
  }
  if (data.type === 'op' && isOperation(data.op)) {
    return { type: 'op', op: data.op }
  }
  return null
}

export function parseServerMessage(raw: string): ServerMessage | null {
  const data = parseJson(raw)
  if (!data) return null

  if (
    data.type === 'snapshot' &&
    typeof data.rev === 'number' &&
    isSnapshot(data.state)
  ) {
    return { type: 'snapshot', rev: data.rev, state: data.state }
  }
  if (
    data.type === 'op' &&
    typeof data.rev === 'number' &&
    isOperation(data.op)
  ) {
    return { type: 'op', rev: data.rev, op: data.op }
  }
  if (data.type === 'noop' && typeof data.opId === 'string') {
    return { type: 'noop', opId: data.opId }
  }
  return null
}
