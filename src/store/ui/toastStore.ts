import { create } from 'zustand'

export type ToastTone = 'success' | 'info' | 'error'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface Toast {
  id: number
  message: string
  tone: ToastTone
  action?: ToastAction
  /** Milliseconds before it dismisses itself. 0 keeps it until dismissed. */
  duration: number
}

export interface ToastInput {
  message: string
  tone?: ToastTone
  action?: ToastAction
  duration?: number
}

const MAX_VISIBLE = 4
const ACTION_DURATION = 8000
const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 5000,
  error: 7000,
}

let nextId = 1

interface ToastStore {
  toasts: Toast[]
  show: (input: ToastInput) => number
  dismiss: (id: number) => void
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  show: (input) => {
    const id = nextId
    nextId += 1
    const tone = input.tone ?? 'info'
    const toast: Toast = {
      id,
      message: input.message,
      tone,
      action: input.action,
      duration:
        input.duration ??
        (input.action ? ACTION_DURATION : DEFAULT_DURATION[tone]),
    }

    set((s) => {
      // A burst of identical messages would just stack up; keep the first.
      const last = s.toasts[s.toasts.length - 1]
      if (last && last.message === toast.message && last.tone === tone) return s
      return { toasts: [...s.toasts, toast].slice(-MAX_VISIBLE) }
    })
    return id
  },

  dismiss: (id) =>
    set((s) => {
      const toasts = s.toasts.filter((t) => t.id !== id)
      return toasts.length === s.toasts.length ? s : { toasts }
    }),
}))

type ToastOptions = Omit<ToastInput, 'message' | 'tone'>

/** Use anywhere, including outside React: toast.success('Saved.') */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ ...options, message, tone: 'success' }),
  info: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ ...options, message, tone: 'info' }),
  error: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ ...options, message, tone: 'error' }),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
}
