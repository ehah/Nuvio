# Compatibility matrix

Validated stacks for published **`@nuvio/*`** packages. Expand rows as Nuvio is tested on more environments.

## v0.5.0 stable (Vibe-coder task router — Vite public)

Target release: **`0.5.0`** (see [CHANGELOG](../CHANGELOG.md), [nuvio_v0.5.0.md](./nuvio_v0.5.0.md)).

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler (Vite)** | Vite **5.4+** and **6.x** | **Public v0.5 scope** — full task router + TailAdmin P-A–P-F on Vite. |
| **Bundler (Next)** | Experimental only | `@nuvio/next` remains in repo; **not** in public v0.5 setup docs. Use `pnpm dev:next` for maintainers. |
| **Framework** | React **18.3+** or **19.x** | Simple Mode: Card, Table, Button, Form, Nav, Chart, Section task menus. |
| **Wire protocol** | **v7** (unchanged) | Index v4; no protocol bump in v0.5. |
| **Instrumentation** | `data-nuvio-id` on DOM or forwarded through UI primitives | §12 gap table in [nuvio_v0.5.0.md](./nuvio_v0.5.0.md). |

### v0.5 capabilities

- **Preview Changes** / **Apply to Code** (Simple Mode); human preview without Tailwind tokens.
- Task router modes; container guidance v2; presets v2; Copy Fix Prompt on blocked edits.
- Engine carry-forward from v0.4: table Tier C, plain patch messages, undo stack.

### Next.js (experimental — not public v0.5)

Same as v0.4: custom dev server + client components. Do not document in [nuvioUser.md](./nuvioUser.md) until v0.6+.

---

## v0.4.0 stable (Phase C — vibe-coder, Vite + Next)

Target release: **`0.4.0`** (see [CHANGELOG](../CHANGELOG.md), [nuvio_v0.4.0.md](./nuvio_v0.4.0.md)).

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler (Vite)** | Vite **5.4+** and **6.x** | `@nuvio/vite-plugin` — full feature set. |
| **Bundler (Next)** | Next **14.x** / **15.x** dev | `@nuvio/next` — **custom dev server** + App Router **client** components only. |
| **Framework** | React **18.3+** or **19.x** | Simple mode + table mode on instrumented dashboards. |
| **Wire protocol** | **v7** | Index v4 table metadata; `setTableDataField` patch op. |
| **Instrumentation** | `data-nuvio-id` on DOM or forwarded through UI primitives | Same contract as Vite. |

### v0.4 capabilities

- Quick edits, container guidance, table section/header/row editing, Tier C `tableData` cell copy.
- Copy fix context + open-in-editor handoff; component-aware panel headers.
- Outline v2 with friendly labels + search (simple mode).

### Next.js integration (one mode)

Use `attachNuvioToNextServer(httpServer)` from `@nuvio/next` in a **custom `server.js`** during `next dev`. RSC server components and Turbopack-only `next dev` without custom server are **not** validated in v0.4.0.

Example: `apps/next-dogfood`.

---

## v0.4.0-alpha (Phase C — vibe-coder, Vite)

Target release: **`0.4.0-alpha.0`** (see [CHANGELOG](../CHANGELOG.md), [nuvio_v0.4.0.md](./nuvio_v0.4.0.md)).

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler** | Vite **5.4+** and **6.x** | Same as v0.3. **Next.js dev:** planned for **0.4.0** stable, not alpha. |
| **Framework** | React **18.3+** or **19.x** | Simple mode + table mode on instrumented dashboards. |
| **Wire protocol** | **v7** | Index v4 table metadata; `setTableDataField` patch op. |
| **Instrumentation** | `data-nuvio-id` on DOM or forwarded through UI primitives | Custom `TableCell`-style wrappers must spread props to `<th>`/`<td>`. |

### v0.4 alpha capabilities (Vite)

- Quick edits, container guidance, table section/header/row editing on TailAdmin dogfood.
- Static `tableData` cell copy via `setTableDataField`.
- Copy fix context for Cursor handoff.

---

## v0.3.0-alpha (Phase B — stack mastery)

Target release: **`0.3.0-alpha.0`** (see [CHANGELOG](../CHANGELOG.md), [nuvio_v0.3.0.md](./nuvio_v0.3.0.md)).

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler** | Vite **5.4+** and **6.x** | `@nuvio/vite-plugin` peer. |
| **Framework** | React **18.3+** or **19.x** | `@nuvio/overlay` peer. |
| **Language** | TypeScript / TSX, JSX | Source index scans `.tsx` / `.jsx`. |
| **Styling (host)** | Tailwind CSS **3.4.x** or **4.x** | Overlay remains host-tailwind independent. |
| **Overlay UI** | Self-contained CSS + Shadow DOM | No host TW content entry needed for overlay UI. |
| **Wire protocol** | **v5** | Includes index v3 targeting + patch `activeBreakpoint`. |
| **Node** | **20+** | Matches repo engines. |
| **Package manager** | pnpm, npm, yarn | Monorepo uses pnpm. |

### v0.3 capabilities

- Hierarchy-first host selection with explicit `textTargets` and `styleTargets`.
- Tailwind depth controls across spacing/layout/typography/visual utility families.
- Breakpoint-aware patch writes (`base|sm|md|lg|xl`) for responsive class edits.
- Runtime gate: `NUVIO=0` or `nuvio({ enabled: false })`.
- Dogfood gate: `pnpm dogfood` + TailAdmin build pass before tagging.

---

## v0.2.0-alpha (Phase A — reliability)

Target release: **`0.2.0-alpha.0`** on npm **`alpha`** tag (see [CHANGELOG](../CHANGELOG.md)).

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler** | Vite **5.4+** and **6.x** | `@nuvio/vite-plugin` peer. Vite 7/8: stretch goal; not validated for alpha. |
| **Framework** | React **18.3+** or **19.x** | `@nuvio/overlay` peer. |
| **Language** | TypeScript / TSX, JSX | Source index scans `.tsx` / `.jsx`. |
| **Styling (host)** | Tailwind CSS **3.4.x** or **4.x** | Host app Tailwind is independent of overlay chrome. |
| **Overlay UI** | **Self-contained CSS** + **Shadow DOM** | No host `tailwind.config` `content` entry for `@nuvio/overlay` required. |
| **Node** | **20+** | Matches repo `engines`. |
| **Wire protocol** | **v5** (`0.2.0-alpha`) | Index v2 metadata on `indexReady`; `RuntimeDiagnostics` on connect/index. |
| **Package manager** | pnpm, npm, yarn | Monorepo uses pnpm; consumers may use any. |
| **Browser** | Chromium, Firefox, Safari (current) | Dev WebSocket + overlay; TailAdmin dogfood smoke. |

### v0.2 fixtures (monorepo)

| App | Vite | React | Tailwind | Role |
| --- | ---: | ---: | ---: | --- |
| `apps/demo-app` | 6.x | 19 | 3.4.x | Clean v3 baseline |
| `apps/tailwind-v4-test` | 6.x | 19 | 4.x | CSS-first v4, no overlay in TW content |
| `apps/tailadmin-dogfood` | 6.x | 19 | 4.x | Real dashboard (TailAdmin clone) |

### v0.2 capabilities

- Overlay chip/editor/diagnostics isolated from host CSS (bundled `style.css`, Shadow DOM).
- Collision-aware positioning; versioned `localStorage` keys (`nuvio:*:v2`); reset position.
- Source index **v2**: file, line, tag/component name, literal `className`, map context, risk level.
- Diagnostics: Vite channel, stack versions where detectable, duplicate id errors, selection summary.
- Validate → diff preview → Apply → Undo (unchanged safety model).
- Runtime gate: `NUVIO=0` or `nuvio({ enabled: false })` disables Nuvio WS/index startup.

### Not supported (unchanged)

- **Next.js** / RSC.
- **`className` as** `cn()`, template literal, or non–string-literal expression.
- **Vue / Angular**.
- **Production** bundles without a documented no-op path ([DEV_ONLY.md](./DEV_ONLY.md)).

---

## v0.1.0 (Full MVP — `latest` on npm)

| Area | Supported | Notes |
| ---- | --------- | ----- |
| **Bundler** | Vite **5.4+** and **6.x** | `@nuvio/vite-plugin` peer. |
| **Framework** | React **18.3+** or **19.x** | `@nuvio/overlay` peer. |
| **Language** | TypeScript / TSX, JSX | Source index scans `.tsx` / `.jsx`. |
| **Styling** | Tailwind CSS **3.4.x** | Overlay UI needs Tailwind `content` to include `@nuvio/overlay` (see README §0.1). |
| **Node** | **20+** | Matches repo `engines`. |
| **Wire protocol** | **v4** (`0.1.0`) | Structural ops: `moveSibling`, `setHidden`, `duplicateHost`. |
| **Package manager** | pnpm, npm, yarn | Monorepo uses pnpm; consumers may use any. |
| **Browser** | Chromium, Firefox, Safari (current) | Dev WebSocket + overlay tested locally. |

### Full MVP features (0.1.0)

- Alpha property set plus alignment, gap, width/height, opacity, shadow.
- Sibling reorder, hide/show, duplicate (see [LIMITATIONS.md](./LIMITATIONS.md)).
- Validate → Apply, Undo last, dev-time index, draggable overlay chrome.

When reporting issues, include Vite, React, Tailwind, Node, and `@nuvio/*` versions plus a minimal repro if possible.
