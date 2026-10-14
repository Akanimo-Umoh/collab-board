import type { ComponentProps } from 'react'

// Decorative by default: buttons that use these carry their own accessible name.
const baseProps = {
  viewBox: '0 0 20 20',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

export function CloseIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

export function PlusIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

export function TrashIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M5.5 6l.7 9.2A1.5 1.5 0 0 0 7.7 16.5h4.6a1.5 1.5 0 0 0 1.5-1.3L14.5 6" />
    </svg>
  )
}
