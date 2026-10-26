import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TagList } from '@/features/cards/TagList'
import { useCard } from '@/store/hooks'
import { useUIStore, type DragPreviewGeometry } from '@/store/ui/uiStore'

interface PreviewCardProps {
  cardId: string
  geometry: DragPreviewGeometry
}

function PreviewCard({ cardId, geometry }: PreviewCardProps) {
  const card = useCard(cardId)
  const ref = useRef<HTMLDivElement>(null)

  // Follows the pointer by writing the transform directly: no React renders per move.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const place = (x: number, y: number) => {
      el.style.transform = `translate3d(${x - geometry.offsetX}px, ${y - geometry.offsetY}px, 0) rotate(2deg)`
    }
    place(geometry.startX, geometry.startY)

    const onMove = (event: PointerEvent) => place(event.clientX, event.clientY)
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [geometry])

  if (!card) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ width: geometry.width }}
      className="pointer-events-none fixed top-0 left-0 z-50 flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 shadow-xl will-change-transform"
    >
      <span className="text-sm font-medium wrap-break-word text-ink">
        {card.title}
      </span>
      {card.tags.length > 0 && (
        <span className="flex flex-wrap">
          <TagList tags={card.tags} />
        </span>
      )}
    </div>
  )
}

export function DragPreview() {
  const cardId = useUIStore((s) =>
    s.drag?.mode === 'pointer' ? s.drag.cardId : null,
  )
  const geometry = useUIStore((s) =>
    s.drag?.mode === 'pointer' ? s.drag.preview : null,
  )

  if (!cardId || !geometry) return null
  return createPortal(
    <PreviewCard cardId={cardId} geometry={geometry} />,
    document.body,
  )
}
