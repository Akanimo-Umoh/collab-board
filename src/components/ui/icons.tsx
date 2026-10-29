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

export function PencilIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12.5 5.5l2 2M5 15l.8-3.4 8.2-8.2a1.5 1.5 0 0 1 2.1 0l.5.5a1.5 1.5 0 0 1 0 2.1L8.4 14.2z" />
    </svg>
  )
}

export function ArrowLeftIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16 10H4M9 5l-5 5 5 5" />
    </svg>
  )
}

export function SunIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5V4M10 16v1.5M2.5 10H4M16 10h1.5M4.7 4.7l1 1M14.3 14.3l1 1M4.7 15.3l1-1M14.3 5.7l1-1" />
    </svg>
  )
}

export function MoonIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8z" />
    </svg>
  )
}

/** Points left. Flip it with a -scale-x-100 class for Redo. */
export function UndoIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7.5 5 4 8.5 7.5 12M4 8.5h8a4 4 0 0 1 0 8H9" />
    </svg>
  )
}

/** Six dots drawn as one path (a single DOM node per card). */
export function GripIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} fill="currentColor" stroke="none" {...props}>
      <path d="M5.6 5a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M11.6 5a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M5.6 10a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M11.6 10a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M5.6 15a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M11.6 15a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0" />
    </svg>
  )
}

export function AlertIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 3.5 2.5 16.5h15L10 3.5zM10 8.5v3.5M10 14.5h.01" />
    </svg>
  )
}

export function ColumnsIcon(props: ComponentProps<'svg'>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3.5 4h3.5a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM13 4h3.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    </svg>
  )
}
