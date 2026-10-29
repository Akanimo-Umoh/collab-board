import { Skeleton } from '@/components/ui/Skeleton'

export function BoardListSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your boards…</span>
      <ul
        aria-hidden="true"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  )
}
