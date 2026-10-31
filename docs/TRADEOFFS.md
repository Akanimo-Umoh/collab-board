# Trade-off analysis: custom drag and drop versus a library

**Decision:** build drag and drop from scratch on Pointer Events, with a first-class keyboard path, and keep a single seam (`moveCard`) so a library could replace it later.

**Short version of why:** the Stage 1 brief ruled out drag-and-drop libraries and Stage 2 evaluates event cleanup, re-render discipline and accessibility directly; the custom version fits the operation model and the real-time design more tightly than a library's own state model would; and it costs about 540 lines. The honest cost is that we now own every browser quirk a library would have absorbed.

**Contents**

1. [Context and requirements](#context-and-requirements)
2. [Options considered](#options-considered)
3. [Comparison](#comparison)
4. [What was built](#what-was-built)
5. [What it cost](#what-it-cost)
6. [Where the custom version is weaker](#where-the-custom-version-is-weaker)
7. [When I would switch to a library](#when-i-would-switch-to-a-library)
8. [Verdict](#verdict)

---

## Context and requirements

What the feature had to do:

- Reorder cards inside a column and move them across columns, with order preserved in state and persisted.
- Work with a mouse, touch and a pen, **and entirely from the keyboard with screen reader announcements.** Accessibility failures are an automatic-elimination criterion.
- Keep re-renders minimal during a drag, use proper keys and clean up every event listener.
- Fit the architecture: moves are **operations** that must be sent to other sessions, undoable, and correct when two people move cards at once.
- Stay compatible with the other constraints: no UI library, a small bundle, and a 200+ card board.

## Options considered

| Option | What it is |
|---|---|
| **A. Native HTML5 drag and drop** | The browser's built-in `draggable`, `dragstart`, `dragover`, `drop` events |
| **B. Custom Pointer Events implementation (chosen)** | Our own pointer tracking, hit-testing and keyboard mode |
| **C. dnd-kit** | A modular React drag-and-drop toolkit with pointer, touch and keyboard sensors and screen reader announcements |
| **D. Atlassian pragmatic-drag-and-drop** | A small, framework-agnostic layer built on the native drag and drop API, with helpers for lists and auto-scroll |
| **E. hello-pangea/dnd** | The maintained community fork of react-beautiful-dnd: opinionated list and board dragging with built-in keyboard support |

## Comparison

| Criterion | A. Native HTML5 | B. Custom (chosen) | C. dnd-kit | D. Pragmatic DnD | E. hello-pangea |
|---|---|---|---|---|---|
| **Allowed by the brief** | Yes (not a library) | Yes | Stage 1 banned drag-and-drop libraries; Stage 2 does not say | Same as C | Same as C |
| **Touch support** | Poor: the native API is not reliably triggered by touch | Yes (from the grip handle) | Yes | Inherits native limits | Yes |
| **Keyboard and screen reader** | None built in | Built by us (pick up, arrows, drop, cancel, live region) | Built in | You build the keyboard alternative | Built in |
| **Cursor and drag image** | The OS draws them (the arrow-with-box cursor) | We control them with CSS (`grabbing` and `not-allowed`) and a custom preview | Custom | Native | Custom |
| **Control over re-renders** | Full | Full: drag position is a DOM transform; state changes only when the drop slot changes | Good, but you work within its context and sensors | Good | Library-managed |
| **Fit with the operation model** | Same as custom | Direct: a drop is one `moveCard` call that becomes one operation | Needs a mapping from its events to `moveCard` | Same | Same, with a more opinionated data shape |
| **Compatibility with a DOM-measuring approach** | Same | Yes (we measure real elements) | Has its own collision detection | Native | Requires its own list structure |
| **Bundle cost** | None | None added | A dependency to ship | Small dependency | A dependency to ship |
| **Maintenance burden** | Low code, high quirk count | We own all browser quirks | The library owns them | The library owns them | The library owns them |
| **Time to a correct first version** | Fast to start, slow to make accessible | Slowest | Fast | Fast | Fastest for a plain board |

Library sizes are deliberately not quoted here: they vary by version and by which packages are installed, and a figure I cannot verify would not help the decision.

## What was built

All in `src/features/dnd/`, with the pure parts in `src/lib/`:

| Piece | Responsibility |
|---|---|
| `pointerDrag.ts` | Pointer Events controller: a drag threshold so clicks still open cards, window listeners attached on drag start and removed on drop, cancel, Escape and unmount, `requestAnimationFrame` throttling, hit-testing with binary search, edge auto-scroll for the board and for the column under the pointer, suppression of the click that follows a drag |
| `keyboardDrag.ts` | Keyboard mode: pick up, move (up and down within a column, left and right across columns), drop, cancel, announce, restore focus after a card remounts in another column |
| `DragHandle.tsx` | The focusable grip button with an accessible name and `aria-pressed` |
| `DragPreview.tsx` | The floating card that follows the pointer (DOM transform, no React render per pixel) |
| `DragAnnouncer.tsx` | A live region plus the instructions that the handle references |
| `lib/ordering.ts` | Pure functions for moving a card and for where an arrow key leads |
| `lib/dnd.ts` | Pure geometry: drop-slot search and auto-scroll speed |

Design decisions worth calling out:

- **Previews and commits are separate.** Pointer drags change nothing in the domain until the drop; keyboard moves are local previews. Only a drop becomes an operation, so other sessions and the undo history see one meaningful change.
- **A move is anchored, not indexed.** The drag code works in indexes (easy to compute from the pointer), the store converts to "after this card" for the wire, so concurrent edits do not misplace it.
- **A single seam.** Everything funnels into `moveCard(cardId, columnId, index)`. A library would only need to report that same fact.
- **The native cursor is replaced, not lost.** The browser's built-in drag cursor only appears for native drag and drop. We show "grabbing" over columns and "not allowed" elsewhere using a temporary attribute on the root element.

## What it cost

- About **540 lines** in `features/dnd` and about **170 lines** of pure logic in `lib/dnd.ts` and `lib/ordering.ts`.
- About **330 lines of tests** for ordering, drop-slot search, edge scrolling and the keyboard flow.
- Subtle bugs we had to find and fix ourselves, none of which a mature library would have handed us: the click that fires after a drag and opens the card underneath, focus lost when a card remounts in another column, handler closures over a React event that is cleared after the handler returns, and keeping keyboard previews from broadcasting every key press.

## Where the custom version is weaker

Honestly:

- **No animated sorting.** Cards do not slide aside; a card-shaped placeholder appears where the card will land. Mature libraries animate this.
- **Touch drag starts from the grip handle only.** If the whole card were draggable on touch it would fight page scrolling. A library's touch sensor handles press-and-hold delays more gracefully.
- **Two tab stops per card** (the card and its handle). A roving tabindex would fix it.
- **Pointer path is not covered by automated tests.** jsdom does not implement the layout APIs the drag relies on, so the pointer controller is exercised through its pure helpers and by hand, while the keyboard path has integration tests. An end-to-end browser test is the missing piece.
- **Fewer features:** no multi-select, no nested sortable containers, no dragging between separate boards, a single collision strategy (the column under the pointer, binary search among cards).
- **We own cross-browser behaviour:** pointer capture, scroll containers, text selection during drag and similar differences are ours to chase.

## When I would switch to a library

Switch to **dnd-kit** (my first choice) or the pragmatic-drag-and-drop layer if any of these become requirements:

- Animated reordering or richer drop indicators.
- Nested lists (checklists inside cards), multi-select drag, or dragging between boards.
- Virtualized lists with dragging, where a library's measurement and auto-scroll are worth more than ours.
- A team that should not maintain input-handling code, or a need for broader device coverage than we can test by hand.

The switch is small by design: the library's drop event is translated into one call, `moveCard(cardId, columnId, index)`. Operations, sync, undo, notifications and tests are all downstream of that call and would not change. Only `features/dnd/` is replaced, and the keyboard mode and live-region messages would be checked against what the library provides.

## Verdict

For this project, **custom was the right call**: it satisfied the brief's constraints, gave exact control over re-renders and over the semantics a real-time board needs (preview versus commit, anchored moves), added no dependency, and let the keyboard experience be designed rather than inherited. It was the most expensive route in effort and it carries real maintenance risk. In a product with a team, a deadline and no rule against dependencies, I would start with dnd-kit, keep the same `moveCard` seam, and spend the saved time on the real-time and undo work instead.