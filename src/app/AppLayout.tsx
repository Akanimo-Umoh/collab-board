import { Suspense, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageErrorFallback } from '@/components/PageErrorFallback'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'
import { RouteFallback } from './RouteFallback'

export default function AppLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPathname = useRef(pathname)
  const isBoard = pathname.startsWith('/boards/')

  // Move focus to the page content after in-app navigation (not on first load).
  useEffect(() => {
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    window.scrollTo(0, 0)
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-surface px-4 py-2 text-sm font-medium text-ink shadow-card focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to main content
      </a>

      {/* h-14 is the height the board layout subtracts (--app-header-h). */}
      <header className="h-14 shrink-0 border-b border-border bg-surface">
        <div
          className={cn(
            'mx-auto flex h-full w-full items-center justify-between px-6',
            !isBoard && 'max-w-6xl',
          )}
        >
          <Link to="/" className="flex items-center gap-2 rounded-md">
            <Logo />
            <span className="text-base tracking-tight text-ink">
              Collab<span className="font-bold">Board</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <ErrorBoundary
          resetKey={pathname}
          fallback={(props) => <PageErrorFallback {...props} />}
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
