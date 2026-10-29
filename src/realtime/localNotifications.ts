import { onLocalOperation } from '@/store/domain/domainStore'
import { toast } from '@/store/ui/toastStore'
import { describeOperation } from './describe'

/** Confirms your own creates, saves and deletes with a toast. */
export function startLocalNotifications(): () => void {
  return onLocalOperation((op, before) => {
    const message = describeOperation(op, before, 'local')
    if (message) toast.success(message)
  })
}
