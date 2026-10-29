import { Component, type ErrorInfo, type ReactNode } from 'react'

interface FallbackProps {
  error: Error
  reset: () => void
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: (props: FallbackProps) => ReactNode
  /** When this value changes (e.g. the route), the boundary clears its error and tries again. */
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * React only supports error boundaries as classes. It catches errors thrown
 * while rendering below it (including lazy chunks that fail to load), not
 * errors inside event handlers or async code.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.reset()
    }
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    return error
      ? this.props.fallback({ error, reset: this.reset })
      : this.props.children
  }
}
