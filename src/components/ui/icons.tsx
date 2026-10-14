import type { ComponentProps } from 'react'

// Decorative by default: buttons that use these carry their own accessible name.
export function CloseIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}
