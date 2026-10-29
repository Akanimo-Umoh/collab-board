import { Profiler, type ReactNode } from 'react'
import { isPerfLabEnabled, recordRender } from './perfStats'

const ENABLED = isPerfLabEnabled()

/** Counts React commits for everything inside it, but only while the lab is enabled. */
export function PerfProfiler({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  if (!ENABLED) return <>{children}</>
  return (
    <Profiler id={id} onRender={recordRender}>
      {children}
    </Profiler>
  )
}
