import { useEffect } from 'react'
import { useUIStore } from '@/store/ui/uiStore'
import { useHistoryStore } from './historyStore'

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT')
  )
}

/**
 * Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y. History belongs to one board:
 * it is cleared when `scopeKey` (the board id) changes or the page unmounts.
 */
export function useHistoryShortcuts(scopeKey: string): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey) return
      if (!(event.ctrlKey || event.metaKey)) return

      const key = event.key.toLowerCase()
      const isUndo = key === 'z' && !event.shiftKey
      const isRedo = (key === 'z' && event.shiftKey) || key === 'y'
      if (!isUndo && !isRedo) return

      // Typing in a field: leave Ctrl+Z to the browser's own text undo.
      if (isEditable(event.target)) return

      // Not while a dialog is open or a card is being dragged.
      const ui = useUIStore.getState()
      if (ui.drag || ui.cardModal || ui.pendingDelete) return

      event.preventDefault()
      const history = useHistoryStore.getState()
      if (isUndo) history.undo()
      else history.redo()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      useHistoryStore.getState().clear()
    }
  }, [scopeKey])
}
