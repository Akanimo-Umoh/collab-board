import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/** Decorative placeholder. The container that holds skeletons carries role="status". */
export function Skeleton({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-md bg-ink/10 motion-safe:animate-pulse',
        className,
      )}
      {...rest}
    />
  )
}
