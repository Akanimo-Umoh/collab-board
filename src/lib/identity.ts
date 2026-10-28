import { createId } from './id'

export interface Identity {
  id: string
  name: string
}

const STORAGE_KEY = 'collabboard:identity'

let cached: Identity | null = null

function isIdentity(value: unknown): value is Identity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  )
}

/**
 * A stand-in for authentication: one anonymous identity per browser TAB (sessionStorage), so two tabs behave like two different users.
 */
export function getIdentity(): Identity {
  if (cached) return cached

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isIdentity(parsed)) {
        cached = parsed
        return parsed
      }
    }
  } catch {
    // Storage unavailable or corrupted: fall through and create a fresh identity.
  }

  const created: Identity = {
    id: createId(),
    name: `Guest ${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  }
  cached = created
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(created))
  } catch {
    // Not persisted; the identity lasts until the tab reloads.
  }
  return created
}
