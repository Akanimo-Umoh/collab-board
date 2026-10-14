import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const controlClass =
  'block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-muted/70 transition-colors hover:border-ink-muted/40 ' +
  'aria-[invalid=true]:border-danger-500 disabled:opacity-50'

interface FieldMeta {
  label: string
  hint?: string
  error?: string
}

interface FieldShellProps extends FieldMeta {
  id: string
  required?: boolean
  children: ReactNode
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger-500">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger-500">
          {error}
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

interface TextFieldProps
  extends Omit<ComponentProps<'input'>, 'id'>, FieldMeta {}

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClass, 'h-10', className)}
        {...rest}
      />
    </FieldShell>
  )
}

interface TextAreaProps
  extends Omit<ComponentProps<'textarea'>, 'id'>, FieldMeta {}

export function TextArea({
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  ...rest
}: TextAreaProps) {
  const id = useId()
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(controlClass, 'resize-y', className)}
        {...rest}
      />
    </FieldShell>
  )
}
