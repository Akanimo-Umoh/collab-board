# Performance notes and benchmarks

**Target:** the board stays responsive with **200+ cards, 20+ columns and active comment threads.**

**Result in one paragraph:** with 24 columns, 240 cards and 360 comments, moving a card costs about **2.4 ms** of main-thread time in the production build (render plus layout, median; p95 3.7 ms), and exactly **one React commit** per move. That is a small fraction of a 16.7 ms frame, so list virtualization was evaluated and deliberately not added.

**Contents**

1. [Method](#method)
2. [Results](#results)
3. [Reading the numbers](#reading-the-numbers)
4. [React DevTools evidence](#react-devtools-evidence)
5. [What was done about performance](#what-was-done-about-performance)
6. [Virtualization: evaluated, not adopted](#virtualization-evaluated-not-adopted)
7. [Caveats and what is not measured](#caveats-and-what-is-not-measured)
8. [Reproduce it yourself](#reproduce-it-yourself)

---

## Method

A small opt-in **performance lab** is built into the app. Add `?perf` to a board's URL and a "Performance lab" panel appears. It is loaded on demand, so normal visitors never download it.

| Step | What it does |
|---|---|
| **Seed** | Adds 24 columns, 10 cards per column (240 cards) and 3 cards with 120 nested comments each (360 comments): 624 operations in one batch |
| **Run benchmarks** | Moves 50 random cards to random columns and positions, one at a time, then adds 50 comments to one card |
| **Copy report** | Copies the environment and the results as text |

What is measured:

- **Seed, applied:** time to apply all operations to the store.
- **Seed, painted:** time until two animation frames later, so React rendering, layout and the first paint are included.
- **Move, main-thread cost:** time from dispatching the move until React has rendered and committed, plus a forced style and layout. This is the work our code and the browser's layout do on the main thread for one move.
- **Move, time to next frame:** time until the next animation frame callback (a coarser, display-bound number; see below).
- **React commits:** counted with React's `<Profiler>`. React only reports these in the **development** build.
- **Comment adds:** time to dispatch 50 comments. The card dialog is closed during the benchmark, so no comment component renders.

Environment for all runs: Chrome 156 on Windows, one developer machine.

## Results

Three runs, each from a fresh board with the same seed.

| Measurement | **A.** Dev, offline, DevTools open | **B.** Dev, two tabs, server live | **C.** Production build, DevTools closed |
|---|---|---|---|
| Seed: operations applied | 70.8 ms | 47.0 ms | **36.3 ms** |
| Seed: painted after | 661.7 ms | 737.6 ms | **177.8 ms** |
| Seed: React commits / time in React | 1 commit, 386.9 ms | 1 commit, 451.9 ms | n/a |
| Move: main-thread cost, median | not measured | 8.9 ms | **2.4 ms** |
| Move: main-thread cost, p95 / worst | not measured | 11.6 ms / 14.7 ms | **3.7 ms / 4.6 ms** |
| Move: time to next frame, median | 24.6 ms | 25.0 ms | 24.8 ms |
| Move: React commits | 50 for 50 moves (1.0 each), 243.1 ms total | 49 for 50 moves (1.0 each), 213.5 ms total | n/a |
| Comments: 50 added | 25.8 ms (0.5 ms each) | 37.7 ms (0.8 ms each) | **14.1 ms (0.3 ms each)** |
| Comments: React commits | 0 | 0 | n/a |

Run A used an earlier version of the move metric (time to next frame only), which is why its main-thread row is empty.

## Reading the numbers

- **One commit per move.** In both development runs, a move produces one React commit (49 commits for 50 moves in run B: one random move landed on the card's own position, which is a no-op that changes nothing and renders nothing). A move does not cascade into other components.
- **A move is cheap where it matters.** The production main-thread cost, 2.4 ms median and 4.6 ms worst case across 50 random moves on a 240-card board, leaves most of a 16.7 ms frame free. The development numbers are higher because the development build adds checks and the Profiler, and run B also includes real-time sync work.
- **"Time to next frame" is not our cost.** It stays near 25 ms in all three runs, even though the main-thread work falls from 8.9 ms to 2.4 ms between development and production. It is dominated by waiting for the browser's next frame and painting, so it describes the benchmark's pacing, not the app. It is kept in the report as a reminder of that.
- **Mounting the whole board is the largest single cost, and a one-off.** Rendering 240 cards in one commit takes 387-452 ms of React time in development (about 1.6-1.9 ms per card) and the board is painted about 178 ms after the seed in production. It happens once, when a large board first appears. Interaction after that is unaffected.
- **Batching works.** All 624 seed operations are one store write: 36-71 ms to apply (about 0.06-0.11 ms per operation) and one React commit.
- **Comments are not a board cost.** Adding 50 comments takes 14-38 ms and renders nothing on the board, because comments only render when a card's dialog is open (and then only the latest 30).
- **Real-time sync does not slow moves.** React time per move is about the same with sync off and on: 4.9 ms per commit in run A (243.1 ms over 50 commits) and 4.4 ms in run B (213.5 ms over 49 commits). The server round trip is off the interaction's critical path because changes are applied optimistically.

## React DevTools evidence

Profiling a drag in the React DevTools Profiler (development build, 240 cards): the commit that starts a drag renders in **3.6 ms** and **5.0 ms** in two recordings. The Profiler's "What caused this update?" lists only the dragged `CardItem` and the `DragPreview`. In the flame graph every other card, and every column that is not a target, is grey, meaning "did not render".

That is the intended result of the design:

- Each card subscribes to its own entity and to a **primitive** drag selector, so only the card being dragged changes.
- Columns select a single number (the drop index) that is non-negative only for the column under the pointer, so a drag re-renders the previous and the new target column and nothing else.
- Reordering inside a column rewrites one array of IDs and leaves every card object untouched, so memoized `CardItem`s do not re-render.

## What was done about performance

These were found by reading the code and by measuring the result with the lab. The table lists the change and what it addresses; the benchmark above shows the end state rather than a before and after for each item.

| Change | Problem it addresses |
|---|---|
| **Normalized state, one subscription per entity** (`useCard(id)`, `useColumn(id)`, `useComment(id)`) | A change re-renders only the component that reads the changed entity |
| **`memo` on list items** with primitive props | Parents re-rendering does not re-render every child |
| **Primitive selectors** for drag state | A drag re-renders at most the old and new target column |
| **Same-reference no-ops** in the reducer and store | Duplicate or unchanged operations notify nobody |
| **Drag preview moved with a DOM transform**, drop position stored only when it changes | No React render per pixel of pointer movement |
| **Binary-search hit-testing** for the drop position | A 200-card column costs about 8 layout reads per frame instead of 200 |
| **`requestAnimationFrame` throttling** of hit-testing and auto-scroll | At most one measurement pass per frame |
| **Batched store writes** (`applyOperations`) | Seeding, or undoing a multi-step action, is one render instead of one per operation |
| **Debounced persistence** (300 ms, flushed when the tab is hidden) | The default `persist` serialized the entire state to JSON on every change |
| **Latest-30 comment paging** (15 replies per comment) with "Show earlier" | A very large thread does not mount thousands of components |
| **Iterative comment cascade** on delete | A 20,000-deep thread deletes without overflowing the call stack (tested) |
| **Collapsed remote-change toasts** | A burst of changes from other people is three toasts and a summary, not hundreds |
| **One DOM node for the grip icon** (a single `<path>`) | About 1,400 fewer elements across 240 cards |
| **`React.lazy` for the board page and the lab** | The dashboard does not download the board code, the Markdown libraries or the lab |
| **Frosted glass only on the header and "Add column" panel**, not on every column | Blur over a noisy background on 24 columns would cost more than it looks |

## Virtualization: evaluated, not adopted

**Decision:** no list virtualization at this size.

**Evidence:** one commit and about 2-5 ms per move at 240 cards (see above). The part that grows with card count is the one-off mount, which is acceptable at this size.

**Why it is not free to add here**, so it should be earned by numbers:

- The drag code measures real elements in the page to find the drop position. Windowing would mean replacing that with a height map.
- Keyboard users need every card to exist in the document to reach it with Tab. Dropping offscreen columns from the page would break keyboard navigation, which the brief treats as an automatic-elimination criterion.
- Browser find-in-page and screen reader browsing need the elements to exist.
- I also considered the CSS-only `content-visibility: auto`. It clips box-shadows and focus rings at element edges and its placeholder heights make the board resize as you scroll, so it was rejected.

**Trigger to revisit:** a production mount over about 300 ms, or a move over about 8 ms at the target size.

**Plan if triggered:** window the **columns** first. They are a fixed width, so no measuring is needed: render same-width placeholders for far-offscreen columns and mount them as they approach, with an explicit keyboard fallback. Only then consider long columns, using a measured height map.

## Caveats and what is not measured

- One machine and one browser. Numbers on a low-end phone will be larger; the shape (one commit per move) will not change.
- Development builds are slower than production by design; compare like with like (A and B together, C on its own).
- Run A had DevTools open; run C had it closed. DevTools slows a page noticeably.
- Moves are random, so a few land in the same column and some are no-ops; medians absorb this.
- The comment benchmark times dispatch only. Rendering a comment thread (with the dialog open) is covered by paging rather than a timing.
- **Not measured:** memory, long tasks on mobile devices, boards of thousands of cards, many simultaneous remote operations, and server throughput. The last two are what a load test would cover.

## Reproduce it yourself

**Lab (in any build):**

1. Open a board and add `?perf` to the URL, for example `/boards/<id>?perf`.
2. Expand "Performance lab", keep the defaults (24 columns, 10 cards per column, 3 threads of 120) and click **Seed**.
3. Click **Run benchmarks**, then **Copy report**.
4. For commit counts use `pnpm dev`; for production numbers use `pnpm build && pnpm preview` with DevTools closed. To include sync, run `pnpm dev:server` and open a second tab.
5. **Remove seeded data** deletes the seeded columns with their cards and comments.

**React DevTools:** open the Profiler tab, click record, drag one card to another column, stop. Turn on "Highlight updates when components render" in the Components settings to see the same thing live: only the dragged card and the two columns involved flash.

**By hand:** drag a card across all 24 columns (the board auto-scrolls near the edges), keyboard-move a card down a long column (it scrolls into view), and open a card with a 120-comment thread (it shows the latest 30 with "Show 30 earlier comments").