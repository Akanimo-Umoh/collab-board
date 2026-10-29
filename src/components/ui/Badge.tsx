import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const variants = {
  brand: 'bg-badge-bg text-badge-ink',
  neutral: 'bg-surface-muted text-ink-muted',
  danger: 'bg-danger-500/10 text-danger-500',
} as const

interface BadgeProps extends ComponentProps<'span'> {
  variant?: keyof typeof variants
}

export function Badge({ variant = 'brand', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...rest}
    />
  )
}
