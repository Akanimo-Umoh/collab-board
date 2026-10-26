import type { CardPosition } from '@/lib/ordering'
import type { ID } from '@/types/domain'

export interface MoveCardRequest {
  cardId: ID
  from: CardPosition
  to: CardPosition
}

/**
 * The only door between the UI and "the server". Features depend on this interface, so the WebSocket transport can replace the mock implementation without touching any component.
 */
export interface BoardApi {
  moveCard: (request: MoveCardRequest) => Promise<void>
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const LATENCY_MS = { min: 120, max: 350 }

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Set VITE_MOCK_API_FAILURE_RATE (0 to 1) in .env.local to exercise rollback. */
function getFailureRate(): number {
  const raw: unknown = import.meta.env.VITE_MOCK_API_FAILURE_RATE
  const rate = Number(raw)
  return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0
}

export const boardApi: BoardApi = {
  async moveCard() {
    await wait(
      LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min),
    )
    if (Math.random() < getFailureRate()) {
      throw new ApiError('Mock API: could not save the card move.')
    }
  },
}
