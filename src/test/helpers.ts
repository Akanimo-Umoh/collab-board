import { useHistoryStore } from '@/history/historyStore'
import { useDomainStore } from '@/store/domain/domainStore'
import { useToastStore } from '@/store/ui/toastStore'
import { useUIStore } from '@/store/ui/uiStore'
import { emptySnapshot } from './fixtures'

/** The stores are singletons, so every test that touches them starts from a clean slate. */
export function resetStores(): void {
  useDomainStore.setState(emptySnapshot())
  useHistoryStore.getState().clear()
  useToastStore.setState({ toasts: [] })
  useUIStore.setState({
    drag: null,
    dragAnnouncement: '',
    cardModal: null,
    pendingDelete: null,
    editingColumnId: null,
  })
}
