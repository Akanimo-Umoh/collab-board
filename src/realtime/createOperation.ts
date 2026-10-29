import { createId } from '@/lib/id'
import { getIdentity } from '@/lib/identity'
import type { Operation, OperationInput } from './operations'

export function createOperation(input: OperationInput): Operation {
  return {
    ...input,
    opId: createId(),
    at: new Date().toISOString(),
    by: getIdentity().name,
  } as Operation
}
