import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface IconButtonProps extends Omit<
  ComponentProps<'button'>,
  'aria-label' | 'children'
> {
  label: string
  children: ReactNode
}

export function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors',
        'hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
