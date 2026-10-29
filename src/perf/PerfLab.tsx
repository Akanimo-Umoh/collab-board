import { useId, useState } from 'react'
import { withoutHistory } from '@/history/historyStore'
import { useDomainStore } from '@/store/domain/domainStore'
import type { ID } from '@/types/domain'
import { readRenderStats, resetRenderStats } from './perfStats'
import {
  buildCleanupOperations,
  buildSeedOperations,
  type SeedConfig,
} from './seed'

type Sizes = Omit<SeedConfig, 'boardId'>

const DEFAULTS: Sizes = {
  columns: 24,
  cardsPerColumn: 10,
  hotCards: 3,
  commentsPerHotCard: 120,
}

const FIELDS: { key: keyof Sizes; label: string; min: number; max: number }[] =
  [
    { key: 'columns', label: 'Columns', min: 1, max: 60 },
    { key: 'cardsPerColumn', label: 'Cards per column', min: 1, max: 500 },
    { key: 'hotCards', label: 'Cards with comment threads', min: 0, max: 20 },
    {
      key: 'commentsPerHotCard',
      label: 'Comments per thread',
      min: 0,
      max: 400,
    },
  ]

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.round(value) || min, min), max)

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

async function afterPaint(): Promise<void> {
  await nextFrame()
  await nextFrame()
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]
}

const ms = (value: number) => `${value.toFixed(1)} ms`

function describeRender(commits: number, actualMs: number): string {
  return import.meta.env.DEV
    ? `${commits} React commits, ${ms(actualMs)} in React`
    : 'React commit counts need the dev build (pnpm dev)'
}

export default function PerfLab({ boardId }: { boardId: ID }) {
  const baseId = useId()
  const [sizes, setSizes] = useState<Sizes>(DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState('')

  async function run(task: () => Promise<string>) {
    if (busy) return
    setBusy(true)
    try {
      const line = await task()
      setReport((current) => (current ? `${current}\n${line}` : line))
    } finally {
      setBusy(false)
    }
  }

  async function seed(): Promise<string> {
    const ops = buildSeedOperations({ boardId, ...sizes })
    resetRenderStats()
    const start = performance.now()
    withoutHistory(() => useDomainStore.getState().applyOperations(ops))
    const applied = performance.now() - start
    await afterPaint()
    const painted = performance.now() - start
    const { commits, actualMs } = readRenderStats()
    return `Seed: ${ops.length} operations (${sizes.columns} columns, ${sizes.columns * sizes.cardsPerColumn} cards, ${sizes.hotCards * sizes.commentsPerHotCard} comments). Applied in ${ms(applied)}, painted after ${ms(painted)}; ${describeRender(commits, actualMs)}.`
  }

  async function benchmarkMoves(count: number): Promise<string> {
    const durations: number[] = []
    resetRenderStats()

    for (let i = 0; i < count; i += 1) {
      const { boards, columns } = useDomainStore.getState()
      const board = boards[boardId]
      if (!board || board.columnIds.length < 2) {
        return 'Moves: the board needs at least 2 columns.'
      }
      const cardIds = board.columnIds.flatMap(
        (id) => columns[id]?.cardIds ?? [],
      )
      if (cardIds.length === 0) return 'Moves: the board has no cards.'

      const cardId = cardIds[Math.floor(Math.random() * cardIds.length)]
      const toColumnId =
        board.columnIds[Math.floor(Math.random() * board.columnIds.length)]
      const size = columns[toColumnId]?.cardIds.length ?? 0
      const toIndex = Math.floor(Math.random() * (size + 1))

      const start = performance.now()
      withoutHistory(() =>
        useDomainStore.getState().moveCard(cardId, toColumnId, toIndex),
      )
      await nextFrame() // time until the browser could draw the result
      durations.push(performance.now() - start)
    }

    const sorted = [...durations].sort((a, b) => a - b)
    const { commits, actualMs } = readRenderStats()
    const perMove =
      commits > 0 ? `${(commits / count).toFixed(1)} commits per move` : ''
    return `Moves (${count}): median ${ms(percentile(sorted, 0.5))}, p95 ${ms(percentile(sorted, 0.95))}, worst ${ms(sorted[sorted.length - 1] ?? 0)} to next frame; ${describeRender(commits, actualMs)}${perMove ? ` (${perMove})` : ''}.`
  }

  async function benchmarkComments(count: number): Promise<string> {
    const { boards, columns } = useDomainStore.getState()
    const board = boards[boardId]
    const cardId = board?.columnIds
      .flatMap((id) => columns[id]?.cardIds ?? [])
      .at(0)
    if (!cardId) return 'Comments: the board has no cards.'

    resetRenderStats()
    const start = performance.now()
    for (let i = 0; i < count; i += 1) {
      useDomainStore
        .getState()
        .addComment(cardId, null, `Benchmark comment ${i + 1}`)
    }
    const dispatched = performance.now() - start
    await afterPaint()
    const { commits, actualMs } = readRenderStats()
    return `Comments (${count} added to one card): dispatched in ${ms(dispatched)} (${ms(dispatched / count)} each); ${describeRender(commits, actualMs)}.`
  }

  async function removeSeeded(): Promise<string> {
    const ops = buildCleanupOperations(
      useDomainStore.getState().columns,
      boardId,
    )
    withoutHistory(() => useDomainStore.getState().applyOperations(ops))
    await afterPaint()
    return `Removed ${ops.length} seeded columns (with their cards and comments).`
  }

  async function copyReport() {
    const header = `Environment: ${import.meta.env.DEV ? 'development' : 'production'} build, ${navigator.userAgent}`
    try {
      await navigator.clipboard.writeText(`${header}\n${report}`)
      setReport((current) => `${current}\n(Copied to clipboard.)`)
    } catch {
      // Clipboard blocked: the text is still selectable in the box below.
    }
  }

  const buttonClass =
    'rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted disabled:opacity-40'

  return (
    <details className="fixed bottom-4 left-1/2 z-40 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-border bg-surface shadow-modal">
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-ink">
        Performance lab
      </summary>

      <div className="flex flex-col gap-3 border-t border-border p-4">
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, min, max }) => (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={`${baseId}-${key}`}
                className="text-xs text-ink-muted"
              >
                {label}
              </label>
              <input
                id={`${baseId}-${key}`}
                type="number"
                min={min}
                max={max}
                value={sizes[key]}
                onChange={(event) =>
                  setSizes((current) => ({
                    ...current,
                    [key]: clamp(Number(event.target.value), min, max),
                  }))
                }
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(seed)}
            className={buttonClass}
          >
            Seed
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                async () =>
                  `${await benchmarkMoves(50)}\n${await benchmarkComments(50)}`,
              )
            }
            className={buttonClass}
          >
            Run benchmarks
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(removeSeeded)}
            className={buttonClass}
          >
            Remove seeded data
          </button>
          <button
            type="button"
            disabled={report === ''}
            onClick={() => void copyReport()}
            className={buttonClass}
          >
            Copy report
          </button>
        </div>

        <pre
          role="status"
          className="max-h-48 overflow-auto rounded-md bg-surface-muted p-3 text-xs whitespace-pre-wrap text-ink"
        >
          {report || 'Seed a board, then run the benchmarks.'}
        </pre>
      </div>
    </details>
  )
}
