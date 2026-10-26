import { useUIStore } from '@/store/ui/uiStore'
import { DND_INSTRUCTIONS_ID } from './constants'

export function DragAnnouncer() {
  const message = useUIStore((s) => s.dragAnnouncement)

  return (
    <>
      <p id={DND_INSTRUCTIONS_ID} className="sr-only">
        To move this card, press Space or Enter to pick it up, use the arrow
        keys to move it, then press Space or Enter to drop it. Press Escape to
        cancel.
      </p>
      <p role="status" className="sr-only">
        {message}
      </p>
    </>
  )
}
