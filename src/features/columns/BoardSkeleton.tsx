import type { CSSProperties } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

const HUES = [350, 24, 48, 142]

export function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mesh-bg flex h-[calc(100dvh-var(--app-header-h))] flex-col overflow-hidden"
    >
      <span className="sr-only">Loading board…</span>

      <div aria-hidden="true" className="shrink-0 px-6 pt-5 pb-4">
        <div className="glass flex flex-col gap-3 rounded-card px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-56" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex flex-1 gap-4 overflow-hidden px-6 pb-4"
      >
        {HUES.map((hue) => (
          <div
            key={hue}
            style={{ '--col-h': hue } as CSSProperties}
            className="column-panel flex h-fit w-72 shrink-0 flex-col gap-3 rounded-card p-3"
          >
            <Skeleton className="h-5 w-32" />
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 shadow-card"
              >
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
