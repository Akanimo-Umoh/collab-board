import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const base =
  'w-full rounded-lg border bg-surface px-3 text-sm text-ink transition-colors placeholder:text-ink-muted disabled:opacity-50'

const borderFor = (invalid?: boolean) =>
  invalid ? 'border-danger-500' : 'border-border hover:border-ink-muted/50'

interface FieldProps {
  invalid?: boolean
}

export function Input({
  invalid,
  className,
  ...rest
}: ComponentProps<'input'> & FieldProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(base, 'h-10', borderFor(invalid), className)}
      {...rest}
    />
  )
}

export function Textarea({
  invalid,
  className,
  ...rest
}: ComponentProps<'textarea'> & FieldProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        base,
        'min-h-20 resize-y py-2',
        borderFor(invalid),
        className,
      )}
      {...rest}
    />
  )
}
