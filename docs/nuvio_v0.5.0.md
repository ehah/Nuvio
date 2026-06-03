# Nuvio v0.5.0 — Public Vibe-Coder Release

**Document status:** Implementation and release specification (engineering + product)  
**Release target:** `0.5.0-beta.0` → `0.5.0` stable  
**Audience:** Implementers, vibe coders, indie hackers, founders, AI-native developers

**Prerequisites**

- v0.4.0 engineering complete per [`nuvio_v0.4.0.md`](nuvio_v0.4.0.md) §11 (protocol v7, index v4, table Tier C, Quick edits shell)
- `pnpm dogfood` green on main
- v0.4 manual acceptance scenarios signed in [`DOGFOOD.md`](DOGFOOD.md) (or listed exceptions documented below)

**Companions**

| Doc | Role |
| --- | --- |
| [`nuvio_v0.4.0.md`](nuvio_v0.4.0.md) | **Engine baseline** — patch ops, index v4, table contract, fail-closed rules |
| [`nuvioUser.md`](nuvioUser.md) | Public setup + instrumentation copy-paste (vibe coders read this, not this doc) |
| [`nuvio_v0.5.1.md`](nuvio_v0.5.1.md) | **CLI onboarding** — `@nuvio/cli init` (post–0.5.0 stable) |
| [`DOGFOOD.md`](DOGFOOD.md) | Manual pass/fail checklists per release tag |
| [`COMPATIBILITY.md`](COMPATIBILITY.md) | Public support matrix (Vite-only for v0.5 marketing) |
| [`LIMITATIONS.md`](LIMITATIONS.md) | Honest boundaries |
| [`OVERLAY_PICKER_SYNC.md`](OVERLAY_PICKER_SYNC.md) | Picker ↔ staged picks sync |
| [`SIMPLE_MODE_VISIBILITY_AUDIT.md`](SIMPLE_MODE_VISIBILITY_AUDIT.md) | Step 1 Rule 0 audit sign-off (beta gate) |

**Implementation note**

> v0.5.0 is the **public adoption layer** on top of the **v0.4.0 engine**. Do **not** relax fail-closed patching or rebuild index/patch plumbing. v0.5 changes **overlay UX, copy, task routing, previews, docs, and dogfood instrumentation** — not protocol v7, index v4, or table patch plumbing. See §4 (inheritance) and §19 (carry forward).

**Release phasing**

| Tag | Proves | Does **not** require |
| --- | ------ | -------------------- |
| **`0.5.0-beta.0`** | Core vibe-coder loop on **Cards + Tables** | Forms, Nav, Chart, Section modes; full P-C–P-F dashboard |
| **`0.5.0` stable** | Full public demo surface + 10-minute setup + external dogfood | Next.js public support |

---

## Table of contents

1. [Release positioning](#0-release-positioning)
2. [North star](#1-north-star)
3. [Product philosophy](#2-product-philosophy)
4. [Public support matrix](#3-public-support-matrix)
5. [Relationship to v0.4](#4-relationship-to-v04)
6. [Scope matrix](#5-scope-matrix)
7. [Engine & edit model](#6-engine--edit-model)
8. [Instrumentation contracts](#7-instrumentation-contracts)
9. [Vibe-first editor (task router)](#8-vibe-first-editor-task-router)
10. [Component task menus](#9-component-task-menus)
11. [Guidance, presets, zero dead-ends](#10-guidance-presets-zero-dead-ends)
12. [Trust layer](#11-trust-layer)
13. [Public demo coverage (P-A–P-F)](#12-public-demo-coverage-p-ap-f)
14. [Setup & onboarding](#13-setup--onboarding)
15. [Acceptance scenarios](#14-acceptance-scenarios)
16. [Screenshot acceptance](#15-screenshot-acceptance)
17. [Implementation sequence](#16-implementation-sequence)
18. [Test matrix](#17-test-matrix)
19. [Definition of done](#18-definition-of-done)
20. [Package touchpoints](#19-package-touchpoints)
21. [Risk register](#20-risk-register)
22. [Explicit deferrals](#21-explicit-deferrals)
23. [Behavior rules](#22-behavior-rules)
24. [Appendix — Marketing & success metrics](#23-appendix--marketing--success-metrics)

---

# 0. Release positioning

## Product statement

Nuvio is the last-mile UI editor for vibe coders.

AI builds the application. Nuvio finishes the UI.

Instead of spending tokens on change-this-text, make-this-card-smaller, increase-spacing, change-button-color, update-table-title — users click and edit directly. Nuvio writes safe source-code patches back to React.

## Public promise

```text
Click UI.
Change it visually.
Apply to source code.
Keep coding.
```

## Public tagline

**Primary:** Stop wasting AI tokens on UI tweaks.

**Alternatives:** Your AI built the page. Nuvio finishes it. · The last 10% of vibe coding. · Fix UI without re-prompting your AI.

## Release goal

v0.5.0 is primarily an **adoption release**, not a technology release.

| Objective | Meaning |
| --------- | ------- |
| Reduce friction | Task-oriented panel; no raw ids in Simple Mode |
| Increase trust | Preview Changes, human-language diff, reliable Undo |
| Increase perceived magic | Task menus on cards + tables (beta); full dashboard surface at stable |

The engine (protocol v7, index v4, `setTableDataField`, fail-closed patch) **carries forward unchanged** unless a v0.5 UX requirement needs a small overlay-only addition (e.g. human preview formatting).

---

# 1. North star

## Who we build for

Primary users: AI-assisted builders (v0, Lovable, Bolt, Replit, etc.); indie hackers; startup founders; PMs building apps; former developers returning through AI.

These users are **not** frontend experts. They do not want to learn Tailwind, React internals, AST patching, or CSS architecture on day one. They want **outcomes**.

## Core principle

```text
Tasks, not implementation.
Outcomes, not utilities.
Guidance, not dead ends.
```

## What v0.5.0 optimizes for

Every user should answer **“Can I change this?”** within 2 seconds and **“Why can't I change this?”** within 5 seconds — with **one clear next action**.

## v0.5.0 product promise (honest)

> A founder with no React expertise can install Nuvio, open localhost, click a dashboard card, change text and styling, preview and apply changes, and continue building — **without** understanding Tailwind, ASTs, or source indexing.

**Honest boundary:** Public support is **React + Vite + Tailwind v3/v4** on **instrumented** hosts. Chart graphics, API-driven lists, and dynamic `cn()` patterns still hand off via **Copy Fix Prompt** for edits in your code editor.

---

# 2. Product philosophy

## Rule 0 — Simple Mode visibility (non-negotiable)

In **Simple Mode**, users must **never** see any of the following unless **Developer Details** is enabled:

- `data-nuvio-id` or any raw id string (e.g. `metric.orders.card`, `orders.header.products`)
- `className`
- Tailwind utility tokens (e.g. `bg-white`, `p-4`, `rounded-lg`, `text-gray-500`)
- File paths or line numbers
- AST terms (node, literal, expression, patch host, …)
- Patch op names (`setText`, `mergeTailwind`, `setTableDataField`, `dryRun`, …)
- Risk labels (`caution`, `unsupportedReason`, patchability diagnostics)
- Engine field names: `textTarget`, `styleTarget`, `patchHostId`, `hierarchyRole`

**Simple Mode speaks in UI concepts only.** Allowed user-facing vocabulary includes:

```text
Product Name · Product Price · Column Header · Table Title
Card Label · Card Value · Orders Card · Card Style
Quick Style · Normal · Muted · Strong · Larger
Background · Padding · Radius · Shadow
Preview Changes · Apply to Code · Undo
No pending changes · 1 pending change · Changes to apply
Copy Fix Prompt
What would you like to change?
← Recent Orders Table · ← Orders Card · ← Card Options
```

This rule applies to **every** Simple Mode surface: task router, Outline, errors, preview panel, component menus, onboarding, and blocked states. Violations block beta and stable release (§15 screenshot gate).

## Rule 6 — Human naming only

In Simple Mode:

- Titles and back links must use **visible UI concepts**, not id-derived structure.
- Never show id suffixes such as `nameText`, `valueText`, `row`, `cell`, `header.products`, or numeric keys.
- Parent labels must resolve to the nearest meaningful visible component name.
- If Nuvio cannot infer a specific label, use a safe generic label:
  - Recent Orders Table
  - Product Row
  - Column Header
  - Product Name
  - Orders Card
  - Table Options

**Bad examples:**

- `Row 2 · row`
- `← 2 Table`
- `← NameText Table`
- `orders.row.1.nameText`
- `Column Header` when the visible column is known

**Good examples:**

- Product Name
- Product Price
- Product Category
- Order Status
- Products Header
- Category Header
- Apple Watch Ultra Test
- Product Row
- `← Recent Orders Table`
- `← Orders Card`
- `← Card Options`

**Implementation:** [`human-naming.ts`](../packages/overlay/src/human-naming.ts), [`simple-mode-nav.ts`](../packages/overlay/src/simple-mode-nav.ts), [`selection-summary.ts`](../packages/overlay/src/selection-summary.ts) (re-exports). Regression: [`human-naming.test.ts`](../packages/overlay/src/human-naming.test.ts).

## Rule 5 — Three-question screen rule (Simple Mode layout)

Every Simple Mode screen must answer **only** these three questions:

1. **What am I editing?** — Human title (`Product Name`, `Orders Card`, …) via [`formatSelectionTitle`](../packages/overlay/src/human-naming.ts); never row mode labels or raw ids (Rule 6).
2. **What can I change?** — Task menu, or the controls for the current edit (Text + Quick Style, or Background/Padding/Radius/Shadow for card/table style).
3. **How do I apply it?** — Compact pending-change line + Preview Changes / Apply to Code / Undo.

Anything else — device/breakpoint pickers, Outline, table onboarding hints, text color, font size/weight, More styles depth, technical target pickers — belongs in **Advanced** (collapsed, bottom) or **Developer Details** (header toggle).

**Default visible chrome (Simple Mode):**

```text
1. Friendly editing title
2. Optional plain back link (← Recent Orders Table, ← Orders Card, …)
3. Controls for the current edit
4. Pending changes + Preview / Apply / Undo
5. One collapsed Advanced section (bottom)
```

**Hidden by default:** Device section, breakpoint terminology (`xl`/`md`/`sm`), empty preview panel, table guidance when already editing a table part, Edit target, text/style target dropdowns, duplicate Advanced sections, raw ids, Tailwind utilities, className, file paths, line numbers, AST terms, risk labels, patch op names, hierarchy labels (`textTarget`, `styleTarget`, `patchHostId`, `hierarchyRole`).

**Implementation:** [`PropertyPanelShell.tsx`](../packages/overlay/src/PropertyPanelShell.tsx), [`simple-mode-nav.ts`](../packages/overlay/src/simple-mode-nav.ts), [`simple-mode-actions.tsx`](../packages/overlay/src/simple-mode-actions.tsx), [`selection-guides.ts`](../packages/overlay/src/selection-guides.ts) (`table-parts` only at table root menu).

## Rule 1 — Simple Mode IS the product

Developer Details is a support tool for power users and debugging. Routine polish never requires toggling it on.

## Rule 2 — Hide implementation details by default

Rule 0 supersedes this list. In Developer Details only, expose ids, file:line, raw ops, and engine diagnostics as today.

## Rule 3 — Every failure has exactly one next step

| Bad | Good |
| --- | --- |
| `Text not editable.` | This is a container. **Edit the title instead.** [Edit title] |
| (nothing) | Nuvio can't safely edit this text yet. **[Copy Fix Prompt]** (text contexts) or Nuvio can't safely edit this element. (containers) |

Wire every `unsupportedReason` through [`plain-patch-messages.ts`](../packages/overlay/src/plain-patch-messages.ts) → `suggestedAction` → UI button.

## Rule 4 — Users think in UI parts, not React parts

| Bad | Good |
| --- | --- |
| `metric.orders.card` | Orders Card |
| `orders.header.products` | Column: Products |

Use [`formatSelectionTitle`](../packages/overlay/src/human-naming.ts) for panel titles and bottom chip labels; [`formatFriendlyId`](../packages/overlay/src/human-naming.ts) for Outline and secondary labels.

---

# 3. Public support matrix

## Officially supported (market and document)

```text
React 18+
Vite 5+
Tailwind CSS v3 and v4
npm / pnpm
Local dev server only (not production runtime editing)
```

Validated apps:

| App | Purpose |
| --- | --- |
| `apps/tailadmin-dogfood` | Primary public demo (Tailwind v4) |
| `apps/demo-app` | Minimal 10-minute setup path (Tailwind v3) |
| `apps/tailwind-v4-test` | TW v4 regression |

## Officially unsupported (do not market)

```text
Next.js (see §4 — experimental in repo only)
Remix, Vue, Angular, Svelte
Production runtime editing
Team cloud / hosted editing
```

## Next.js policy (v0.5)

| Status | Detail |
| ------ | ------ |
| In repo | `@nuvio/next`, `apps/next-dogfood` exist from v0.4 |
| Public v0.5 | **Not supported** — omit from COMPATIBILITY marketing row, npm README, and v0.5 DoD |
| Maintenance | Best-effort; no v0.5 scenario or instrumentation requirement |

## Disable gate

`NUVIO=0` (or documented env) must disable overlay in all public docs troubleshooting sections.

---

# 4. Relationship to v0.4

| Area | v0.4 delivered | v0.5 changes |
| ---- | ---------------- | ------------ |
| Patch engine | protocol v7, fail-closed, undo stack | **Carry forward** |
| Index | v4: `rowTargets`, `tableMeta`, `tableDataField` | **Carry forward** |
| Table story | §4.2 ids, table mode, Tier C `setTableDataField` | **Keep**; wrap in task router |
| Panel UX | Quick edits + More styles + component mode headers | **Replace default** with task router (§8) |
| Copy | Validate / Apply | **Rename** Preview Changes / Apply to Code (§11) |
| Presets | 3 utility bundles (`style-presets.ts`) | **Expand** to outcome families (§10) |
| Guidance | Container banner, plain errors, contextual guides | **Extend** multi-choice picker + Copy Fix Prompt branding |
| Onboarding | Welcome + contextual hints (`onboarding-storage.ts`) | **Update copy** for new button labels |
| Outline | Tree v2, search | **Secondary** in panel; still required escape hatch |
| Next.js | Adapter + dogfood | **Out of public v0.5 scope** |

## Terminology — avoid tier collision

| Name | Meaning | Used in |
| ---- | ------- | ------- |
| **Engine edit tiers** | Always (A) / Guided (B) / Table data (C) | §6 — patch/index semantics |
| **Public demo tiers P-A–P-F** | Metric cards, tables, forms, … | §12 — dogfood instrumentation blocks |

Do **not** use “Tier A” alone; always prefix **Engine** or **P-** (public demo).

---

# 5. Scope matrix

| Capability | v0.4 | v0.5 beta | v0.5 stable | Deferred |
| ---------- | :--: | :-------: | :---------: | :------: |
| **Experience** | | | | |
| Quick edits + More styles | ✅ | Subsumed by task screens (cards/tables) | Full component modes | |
| Task router — Cards | | ✅ | ✅ | |
| Task router — Tables | | ✅ | ✅ | |
| Task router — Form/Nav/Chart/Section/Button | | | ✅ | |
| Human preview panel | | ✅ | ✅ | |
| Preview Changes / Apply to Code | | ✅ | ✅ | |
| Style presets (outcome-named) | partial (3) | Card/table tasks only | ✅ expanded | |
| Contextual onboarding guides | ✅ | ✅ cards/tables copy | ✅ all modes | |
| **Tables & data** | | | | |
| Table section + headers (Engine A/B) | ✅ | ✅ | ✅ | |
| Static `tableData` cell edit (Engine C) | ✅ | ✅ | ✅ | |
| **Platform** | | | | |
| Vite dev (full) | ✅ | ✅ | ✅ public | |
| Next.js dev | ✅ experimental | repo only | repo only | public v0.6+ |
| **Workflow** | | | | |
| Copy Fix Prompt | ✅ | ✅ | ✅ | |
| Screenshot acceptance gate | | ✅ | ✅ | |
| **Dogfood P-A–P-F** | partial | **P-A + P-B only** | **P-A–P-F** | |

---

# 6. Engine & edit model

Inherited from v0.4 §4. Implementers must read [`nuvio_v0.4.0.md`](nuvio_v0.4.0.md) §4.1–4.3 for full detail. Summary:

## Engine edit tiers

| Tier | Vibe-coder capability | Requirement |
| ---- | --------------------- | ----------- |
| **Always** | Edit text + styles on selected host | `data-nuvio-id` + literal `className` + string-literal text (or guided child) |
| **Guided** | Click container → jump to title, label, header, row | Parent id + `textTargets[]` / container guidance / Outline |
| **Table data (C)** | Edit cell copy from `const tableData = [...]` | Index `tableMeta` + explicit row/cell ids + `setTableDataField` op |

**Policy:** fail-closed on ambiguous `.map()` writes. Tier C only when index proves named `const` binding in same module.

## Patch ops (no new ops required for v0.5)

| Op | Use |
| -- | --- |
| `setText` | String-literal JSX text |
| `mergeTailwind` / alpha style picks | Background, padding, radius, typography, layout |
| `setTableDataField` | `{ hostId, rowKey, field, value }` → `tableData[i].field` |
| `setHidden` | Hide/show host |
| `moveSibling` | Reorder (Developer Details / advanced; not primary v0.5 UX) |

Protocol: **`PROTOCOL_VERSION = 7`** ([`packages/shared/src/protocol.ts`](../packages/shared/src/protocol.ts)). v0.5 does **not** bump protocol unless a preview-only message field is added (optional).

## Index v4 fields (vite-plugin)

| Field | Purpose |
| ----- | ------- |
| `tableMeta` | `{ dataBinding, file, line, columns[] }` for local `tableData.map` |
| `rowTargets[]` | `{ rowKey, nuvioId, label, file, line }` from `orders.row.${id}` |
| `textTargets[]` | Child ids for guided editing |
| `insideMap: caution` | Block unsafe text patch unless explicit cell id + Tier C path |

## Row content matrix

| Cell content in source | Simple Mode behavior |
| ---------------------- | -------------------- |
| String literal (`Products`) | ✅ Text field → `setText` |
| Expression (`{product.name}`) | ✅ Tier C when `nameText` id + `tableMeta` |
| Badge / custom component | Edit literal children or Copy Fix Prompt |
| Dynamic list from API | Copy Fix Prompt: wire ids when data is stable |
| ApexCharts / canvas graphics | Copy Fix Prompt — not in v0.5 scope |

---

# 7. Instrumentation contracts

Vibe coders and public demos depend on **predictable ids**. Copy-paste contracts live in [`nuvioUser.md`](nuvioUser.md); engineering source of truth below.

## Metric card (P-A)

```tsx
<div data-nuvio-id="metric.orders.card" className="...">
  <span data-nuvio-id="metric.orders.label" className="...">Orders</span>
  <span data-nuvio-id="metric.orders.value" className="...">1,234</span>
</div>
```

**Simple labels:** Orders Card · Orders label · Orders value

## Table block (P-B) — full contract

Instrument the **whole block**, not only the scroll wrapper:

```tsx
<div data-nuvio-id="orders.section" className="rounded-2xl border ...">
  <div className="flex ...">
    <h3 data-nuvio-id="orders.title" className="...">Recent Orders</h3>
    <button data-nuvio-id="orders.filter" className="...">Filter</button>
    <button data-nuvio-id="orders.seeAll" className="...">See all</button>
  </div>
  <div data-nuvio-id="orders.table" className="max-w-full overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow data-nuvio-id="orders.header.row">
          <TableCell isHeader data-nuvio-id="orders.header.products" className="...">
            Products
          </TableCell>
          {/* category, price, status */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((product) => (
          <TableRow
            key={product.id}
            data-nuvio-id={`orders.row.${product.id}`}
            className="..."
          >
            <TableCell className="...">
              <p data-nuvio-id={`orders.row.${product.id}.nameText`} className="...">
                {product.name}
              </p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

**Wrapper rule:** `TableCell`, `TableRow`, and UI wrappers **must forward** `data-nuvio-id` and `className` to the DOM node ([`apps/tailadmin-dogfood/src/components/ui/table/index.tsx`](../apps/tailadmin-dogfood/src/components/ui/table/index.tsx)).

## Chart block (P-B / section polish)

```tsx
<div data-nuvio-id="chart.sales" className="...">
  <h3 data-nuvio-id="chart.sales.title" className="...">Statistics</h3>
  <p data-nuvio-id="chart.sales.subtitle" className="...">Overview</p>
  {/* ApexCharts — not editable in v0.5 */}
</div>
```

**Public claim:** title, subtitle, card background/padding only — **not** chart data, colors, or series.

## Form field (P-C)

```tsx
<label data-nuvio-id="form.email.label" className="...">Email</label>
<input data-nuvio-id="form.email.input" placeholder="you@example.com" className="..." />
```

Placeholders must be string literals on the input for in-panel edit.

## Navigation (P-E)

Minimum: one instrumented nav label, e.g. `nav.dashboard` on a sidebar link. TailAdmin today has `app.sidebar` (container) — v0.5 requires **at least one child link id** for nav label editing scenario.

## Section / landing (P-F)

```tsx
<section data-nuvio-id="hero.section" className="...">
  <h1 data-nuvio-id="hero.heading" className="...">...</h1>
  <p data-nuvio-id="hero.description" className="...">...</p>
  <button data-nuvio-id="hero.cta" className="...">Get started</button>
</section>
```

For v0.5 stable, use **`dashboard.title`** on TailAdmin Home plus one additional section block instrumented OR document `apps/demo-app` as P-F path.

## Instrumentation checklist (minimum ids)

| Pattern | Required ids |
| ------- | ------------ |
| Metric card | `{host}.card`, `{host}.label`, `{host}.value` |
| Table block | `{host}.section`, `{host}.title`, `{host}.table`, `{host}.header.*`, `{host}.row.{key}`, `{host}.row.{key}.nameText` (Tier C) |
| Chart block | `{host}.card` or section root, `{host}.title`, `{host}.subtitle` |
| Form field | `{host}.label`, `{host}.input` (or `.placeholder` on input) |
| Nav item | `{host}.nav.{item}` or per-link id |
| Button | id on `<button>` with literal `className` |

## TailAdmin current state vs v0.5 requirements

| Block | Public tier | Instrumented today | Beta | Stable action |
| ----- | ----------- | ------------------ | ---- | ------------- |
| EcommerceMetrics | P-A | ✅ | Verify card task router | — |
| Recent Orders | P-B | ✅ | Verify table task router | — |
| StatisticsChart | P-B | ✅ `chart.sales.*` | — | Chart mode + verify |
| MonthlyTarget | P-B/F | ✅ `target.monthly.*` | — | Chart mode |
| DemographicCard | P-B/F | ✅ `demo.card` / `.title` / `.subtitle` | — | Chart mode |
| DefaultInputs / forms | P-C | ✅ `form.email.label` / `.input` | — | Form mode |
| AppSidebar | P-E | ✅ `app.sidebar` + `nav.dashboard` | — | Nav mode |
| Home dashboard title | P-F | ✅ `dashboard.title` | — | Section block or demo-app |

Update [`apps/tailadmin-dogfood/README.md`](../apps/tailadmin-dogfood/README.md) id table when instrumentation completes.

---

# 8. Vibe-first editor (task router)

## Problem (v0.4 residual)

Quick edits + More styles improved v0.3, but the panel still reads as a **developer tool** (many controls visible at once, component mode as header only).

## v0.5 solution

The **default Simple Mode panel** becomes **task-oriented** and follows **Rule 5** (three questions):

1. User selects element on canvas (or Outline in Advanced).
2. Panel shows **friendly selection title** only (Rule 0, Rule 4) — e.g. `Product Name`, `Orders Card`, `Recent Orders Table`.
3. Optional **plain back link** under title — e.g. `← Recent Orders Table`, `← Orders Card`, `← Card Options` ([`simple-mode-nav.ts`](../packages/overlay/src/simple-mode-nav.ts)). Never mode names like `Rows ← Back`.
4. If the host has multiple editable parts → **“What would you like to change?”** menu.
5. User picks a task (or clicks a direct cell) → **sub-screen** with Text + **Quick Style**, or Background/Padding/Radius/Shadow for style tasks.
6. **Pending changes** line + **Preview Changes** → human diff → **Apply to Code** / **Undo** ([`simple-mode-actions.tsx`](../packages/overlay/src/simple-mode-actions.tsx)).
7. **Advanced** (single collapsed section at bottom): Responsive preview (Desktop/Mobile), text color/size/weight, card style presets, Outline, Show Developer Details.

**Beta scope (0.5.0-beta.0):** task router shipped for **Card** and **Table** first. **Stable (`0.5.0`):** Button, Form, Nav, Chart, and Section modes are enabled in Simple Mode.

## Panel order (canonical v0.5 Simple Mode)

```text
1. Selection title (friendly name — Rule 0)
2. Back link when on sub-screen (← host name, not mode name)
3. Task menu OR active edit controls (Text + Quick Style, or style picks)
4. Pending changes · Preview Changes · Apply to Code · Undo
5. Advanced ▼  →  Responsive preview · More styles · Outline · Developer Details
```

**Not in default Simple Mode:** Device block, breakpoint labels (`xl`/`md`), standalone Outline, table guidance on sub-screens, large empty preview panel, duplicate Advanced.

**Rule 0 check:** No step 1–5 surface may show ids, className, utilities, file paths, patch ops, or risk labels.

## Example screens (Simple Mode)

**Table cell — Product Name:**

```text
Product Name
← Recent Orders Table

Text · Quick Style (Normal / Muted / Strong / Larger)
No pending changes → Preview / Apply / Undo
Advanced ▼
```

**Card root menu:**

```text
Orders Card
What would you like to change?
[ Label ] [ Value ] [ Card Style ]
```

**Card Style sub-screen:**

```text
Orders Card
← Card Options
Background · Padding · Radius · Shadow
```

**Table guidance:** [`table-parts`](../packages/overlay/src/selection-guides.ts) onboarding hint shows **only** at table root menu — never when editing Product Name, Column Header, Table Title, etc.

## Task router state machine

| State | Entry | UI |
| ----- | ----- | -- |
| `idle` | No selection | Empty / “Click something to edit” |
| `menu` | Multi-part host (card, table section, form group) | Primary task list |
| `task:*` | User picked task | Sub-screen controls only |
| `blocked` | Patch unsupported | Plain reason (Rule 0) + one action — **Copy Fix Prompt** or **Edit [friendly name]** |
| `preview` | After Preview Changes | Human diff only (Rule 0) + Apply / back |

**Implementation:** New overlay module (e.g. `task-router.tsx`) **wraps** existing pickers ([`PropertyPanelShell.tsx`](../packages/overlay/src/PropertyPanelShell.tsx), [`component-mode.tsx`](../packages/overlay/src/component-mode.tsx), [`table-panel.tsx`](../packages/overlay/src/table-panel.tsx)). Do **not** duplicate patch staging logic.

## Mode detection

Reuse [`detectComponentMode`](../packages/overlay/src/component-mode.tsx) + [`detectTableMode`](../packages/overlay/src/table-panel.tsx):

| `ComponentModeKind` | Detection hint | Phase |
| ------------------- | -------------- | ----- |
| `card` | `.card` suffix, `hierarchyRole: card` | **Beta** |
| `table` | `hierarchyRole`, `orders.*`, `.table`, `.section` + table meta | **Beta** |
| `button` | `button`, `.filter`, `.seeAll` | Stable |
| `form` | `.form`, form field ids | Stable |
| `nav` | `.nav`, `.sidebar` | Stable |
| `chart` | `.chart`, chart component names | Stable |
| `section` | default for multi-child containers without finer mode | Stable |

## Simple Mode vs Developer Details

| Surface | Simple Mode (v0.5) | Developer Details |
| ------- | ------------------ | ----------------- |
| Selection | Orders Card | `metric.orders.card` + file:line |
| Primary actions | Preview Changes / Apply to Code | Validate / Apply (optional keep) |
| Preview | Human field diff only — no utilities or op names (Rule 0) | Raw `diffSummary` / ops |
| Targets | Task labels only (Label, Table Title, …) | Full ids + patch host |
| Errors | One plain sentence + one action button | Raw `unsupportedReason` code |
| Outline | Friendly names only; ids/paths hidden | Ids + file paths |
| Breakpoint | Responsive preview: Desktop / Mobile (Advanced) | `activeBreakpoint: md` + full BP list |
| Stack versions | Hidden | Vite / React / TW |

**Persistence:** existing `localStorage` toggle for Developer Details (v0.2+).

---

# 9. Component task menus

Each mode defines **primary menu items** → **sub-screen** → **underlying v0.4 control**. All menu labels must use Rule 0 vocabulary only.

**Beta (0.5.0-beta.0):** Card mode + Table mode only.  
**Stable (0.5.0):** Button, Form, Nav, Chart, Section modes below.

## Card mode (P-A) — **beta required**

**Menu:**

```text
What would you like to change?

Label
Value
Card Style
```

| Task | Sub-screen controls (Simple Mode) | Advanced (collapsed) |
| ---- | ------------------- | -------------------- |
| Label | Text, **Quick Style** (Normal/Muted/Strong/Larger) | Text color, Size, Weight, More styles |
| Value | Text, Quick Style | Text color, Size, Weight |
| Card Style | Background, Padding, Radius, Shadow | Card presets (Cleaner, Compact, …), Hide |

**Back navigation:** `← Orders Card` from Label/Value; `← Card Options` from Card Style ([`buildSimpleBackNav`](../packages/overlay/src/simple-mode-nav.ts)).

**Target switching:** internal `onSelectId` to `metric.*.label` / `.value` / `.card` — never show `textTarget` label.

## Button mode (P-D) — **stable only**

**Menu:** Text · Color · Size · Radius · Width · **Position** (optional)

| Task | Controls | Notes |
| ---- | -------- | ----- |
| Text | Text, Color | `setText` |
| Color | Background, Text color | style picks |
| Size | Padding presets (Compact / Default / Large) | maps to `p-*` / `text-*` whitelist |
| Width | Full width toggle | `w-full` |
| Position | Move down/up/left/right (margin chips) | More styles → margin; see §10 layout |

## Table mode (P-B) — **beta required**

**Menu:** Title · Column Headers · Rows · Table Style

Maps directly to [`TablePanel`](../packages/overlay/src/table-panel.tsx) sub-targets:

```text
Recent Orders table
├── Table Title
├── Column Headers   (picker: Products, Category, …)
├── Rows             (list or canvas click)
└── Table Style      (Background, Padding, Radius, Hide)
```

| Task | Behavior (Simple Mode) |
| ---- | -------- |
| Table Title | Text + Quick Style; title `Table Title` |
| Column Headers | Picker at menu level; direct header click → `Column Header` + Text + Quick Style (no row picker) |
| Rows | Row list at menu level; direct cell click → `Product Name` / `Product Price` / … + Text + Quick Style (no table guidance) |
| Table Style | Background, Padding, Radius, Shadow; back `← Table Options` |

**Direct cell edit:** clicking a product name on canvas opens `Product Name` screen immediately — no `Row 1 · product name`, no `Rows ← Back`, no table guidance banner.

**Never** show 20 property dropdowns before user picks Table Title vs Column Headers vs Rows.

## Form mode (P-C) — **stable only**

**Menu:** Label · Placeholder · Button text · Spacing

| Task | Target suffix | Engine |
| ---- | ------------- | ------ |
| Label | `.label` | `setText` |
| Placeholder | `.input` placeholder attr | `setText` or dedicated op if added |
| Button text | adjacent `.button` / submit | `setText` |
| Spacing | field wrapper | padding/gap picks |

## Navbar mode (P-E) — **stable only**

**Menu:** Logo text · Navigation items · Colors · Spacing

Requires per-link ids. Container-only `app.sidebar` shows **Guidance** → pick a link in Outline or Copy Fix Prompt to add ids.

## Chart mode — **stable only**

**Menu:** Title · Subtitle · Card Style

Contextual guide [`chart-polish`](../packages/overlay/src/selection-guides.ts) explains chart numbers usually need source edits.

## Section mode (P-F) — **stable only**

**Menu:** Heading · Description · Background · Layout spacing

Uses container guidance (§10) when user clicks wrapper without picking a part.

---

# 10. Guidance, presets, zero dead-ends

## Container guidance (v2)

When selecting a non-text-editable container with children:

```text
This section contains editable content.

Choose what you want to edit:

Heading
Description
Button
Card
```

**Implementation:** extend [`container-guidance.tsx`](../packages/overlay/src/container-guidance.tsx) — multi-choice buttons call `onSelectId(childId)`.

**Rules:**

- Never silently apply style patch on wrong host (v0.3 policy).
- Guidance **may switch selection** to child; user always confirms via click.

## Plain error map

Retain v0.4 ≥15 reasons in [`plain-patch-messages.ts`](../packages/overlay/src/plain-patch-messages.ts).

| `suggestedAction` | UI button |
| ----------------- | --------- |
| `switchTarget` | Edit [friendly child name] |
| `addId` | Copy Fix Prompt |
| `useHandoff` | Copy Fix Prompt |
| `changeBreakpoint` | Switch to [label] |
| `none` | (explanation only) |

Every blocked state in Simple Mode shows:

```text
Nuvio can't safely edit this text yet.   (when editing text / label / cell context)

[Copy Fix Prompt]
```

For non-text containers:

```text
Nuvio can't safely edit this element.

[Copy Fix Prompt]
```

One plain reason sentence (Rule 0 — no `unsupportedReason` code). **Open file** only in Developer Details or Advanced. File, line, and ids go to **clipboard only** when user clicks Copy Fix Prompt.

**Helper:** [`getSimpleBlockedEditFallback`](../packages/overlay/src/selection-summary.ts) picks text vs element copy.

## Copy Fix Prompt

Rename UI string from “Copy fix context” → **Copy Fix Prompt**.

Payload via [`buildFixHandoffClipboard`](../packages/overlay/src/fix-handoff.ts):

- file, line, component, host id
- user intent, plain reason
- suggested next step + optional prompt for your editor or AI assistant

Optional: **Open file** via [`buildEditorUrl`](../packages/overlay/src/fix-handoff.ts) / `NUVIO_EDITOR_URL`.

Table-specific snippet: `MAKE_TABLE_EDITABLE_SNIPPET` (§4.2 contract).

## Presets (v0.5 outcome families)

Users never see Tailwind utilities. Presets map to **whitelist fragments** → [`applyStylePresetToPicks`](../packages/overlay/src/style-presets.ts).

### Cards

| Preset | Maps to (example fragment) | Context |
| ------ | -------------------------- | ------- |
| Cleaner | reduced padding, subtle border | Card Style |
| Compact | `p-4 gap-2` | Card Style |
| Spacious | `p-8 gap-4` | Card Style |
| Modern | `rounded-xl shadow-sm` | Card Style |
| Elevated | `rounded-xl shadow-md border` | Card Style |

### Text (Quick Style — default edit area)

| Chip | Maps to (whitelist fragment) |
| ---- | ---------------------------- |
| Normal | Reset to baseline picks |
| Muted | `text-gray-500 dark:text-gray-400` |
| Strong | `font-semibold text-gray-900 dark:text-white` |
| Larger | `text-lg` |
| Smaller | `text-sm` |

**Quick Style** replaces raw Text color + Size + Weight in the main edit area. Full color/size/weight controls live under **Advanced**. Defined in [`QUICK_TEXT_STYLE_PRESETS`](../packages/overlay/src/style-presets.ts).

### Text (Advanced / legacy presets)

### Buttons

| Preset | Fragment direction |
| ------ | ------------------ |
| Soft CTA | light bg + brand text |
| Strong CTA | solid brand bg + white text |
| Secondary | border + muted bg |

### Sections

| Preset | Fragment direction |
| ------ | ------------------ |
| Compact | `py-4 px-4` |
| Balanced | `py-6 px-6` |
| Spacious | `py-10 px-8` |

**Tests:** golden test per preset — applying preset must **not drop** unrelated existing utilities (v0.4 card-emphasis lesson).

## Layout helpers (carry v0.4)

Under **Advanced** or Button → Position:

| Vibe label | Maps to |
| ---------- | ------- |
| Stack vertically | `flex-col` |
| Row layout | `flex-row` |
| Center content | `justify-center items-center` |
| Space between | `justify-between` |
| Full width | `w-full` |
| Move down a little | `mt-2` (margin chips) |

**Defer:** canvas drag-and-drop, visual grid, absolute positioning.

---

# 11. Trust layer

## Rename actions (UI only)

| v0.4 | v0.5 Simple Mode |
| ---- | ---------------- |
| Validate | **Preview Changes** |
| Apply | **Apply to Code** |

Protocol/API names (`dryRun`, `patchApply`) **unchanged** unless v0.6.

Developer Details may keep Validate/Apply labels optionally.

## Pending changes + preview flow (Simple Mode)

[`simple-mode-actions.tsx`](../packages/overlay/src/simple-mode-actions.tsx) — no large empty preview box.

| State | UI |
| ----- | -- |
| Before edits | `No pending changes` — Preview/Apply disabled |
| After edit, before preview | `1 pending change` — Preview enabled, Apply disabled |
| After successful preview | `Changes to apply:` + human-readable diff — Apply enabled |

Developer Details may still show raw `previewSummary` / ops.

## Human preview panel

After **Preview Changes**, show **human language** diff only (Rule 0) — not patch ops, utilities, or file paths.

**Input:** `baselinePicks`, `draftPicks`, `baselineText`, `draftText`, field labels from active task screen.

**Output example (Simple Mode):**

```text
Background:
  white → blue

Padding:
  16px → 24px

Text:
  Recent Orders → Latest Purchases
```

**Mapping rules (Simple Mode display):**

| Internal | Simple Mode display |
| -------- | ------------------- |
| `bg-white` | white |
| `bg-blue-500` | blue |
| `p-4` | 16px |
| `p-6` | 24px |
| `rounded-lg` | rounded (large) |
| unmapped change | “Background changed” or “Style updated” — **never** show raw utility strings |

**Rule 0:** If a value cannot be mapped to plain language, use a generic label (“Background changed”) rather than leaking Tailwind tokens. Full utilities appear in Developer Details preview only.

**Implementation:** new `human-preview.ts` + panel section in overlay; unit tests for common mappings and **no-token** fallback.

## Undo

Mandatory, always visible, same undo stack as v0.4.

---

# 12. Public demo coverage (P-A–P-F)

**Beta gate:** P-A (metric cards) + P-B (tables) only — must pass §14 A and §15 screenshots.  
**Stable gate:** P-C through P-F — required for `0.5.0` public claim, not for beta.

## P-A — Metric cards (**beta required**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Text | Label + value editable |
| Colors | Text + background on card/label/value |
| Spacing | Padding via Card Style or presets |
| Radius | Radius control |
| Hide/show | Hide section/card |

**TailAdmin files:** `EcommerceMetrics.tsx`

## P-B — Tables (**beta required**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Title | §4.2 `orders.title` |
| Headers | All header cells indexed |
| Row text | Tier C on at least one column |
| Row style | Row host `className` |
| Table style | Section wrapper styles |

**TailAdmin files:** `RecentOrders.tsx`

## P-C — Forms (**stable only**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Labels | `setText` on label id |
| Placeholders | literal placeholder on input |
| Button text | submit/button id |
| Spacing | field/group padding |

**TailAdmin files:** `DefaultInputs.tsx`, form components — **expand instrumentation**

## P-D — Buttons (**stable only**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Text | Filter, See all, CTA buttons |
| Color | bg/text picks |
| Size | padding presets |
| Width | full width toggle |

**TailAdmin files:** `RecentOrders.tsx` buttons, other dashboard CTAs

## P-E — Navigation (**stable only**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Logo text | if present on instrumented host |
| Nav labels | ≥1 sidebar link editable |
| Spacing | sidebar section padding |

**TailAdmin files:** `AppSidebar.tsx` — **add link ids**

## P-F — Landing / section blocks (**stable only**)

| Requirement | Pass criteria |
| ----------- | ------------- |
| Headings | H1/H2 text |
| Descriptions | paragraph text |
| Buttons | CTA text + style |
| Spacing | section padding |
| Backgrounds | section bg |

**TailAdmin:** `Home.tsx` (`dashboard.title`) + instrumented section OR **`apps/demo-app`** as primary P-F path for 10-minute setup story.

---

# 13. Setup & onboarding

**Automated setup (0.5.1+):** [`nuvio_v0.5.1.md`](nuvio_v0.5.1.md) — `pnpm dlx @nuvio/cli init`.

## Goal

**Stable only:** new user → first successful edit in **under 10 minutes** using [`nuvioUser.md`](nuvioUser.md) only (scenario S8). Beta validates TailAdmin card + table flows for internal and early testers.

## Install

```bash
pnpm add -D @nuvio/vite-plugin @nuvio/overlay
```

## Configure (minimal)

1. Add `@nuvio/vite-plugin` to `vite.config.ts`
2. Mount `NuvioDevShell` in app root
3. Add `data-nuvio-id` to elements users should edit (start with one card)
4. `pnpm dev` → click **Edit** on Nuvio chip

Document full steps in `nuvioUser.md` — not duplicated here.

## First launch onboarding

Update [`GUIDE_CONTENT`](../packages/overlay/src/selection-guides.ts) welcome and hints — **no** `data-nuvio-id`, Validate, or Apply in Simple Mode copy:

```text
Welcome to Nuvio

Click any highlighted element to edit it.

Preview your changes, then Apply to Code.
Changes update your source files. Undo anytime.
```

Storage: [`onboarding-storage.ts`](../packages/overlay/src/onboarding-storage.ts) — dismiss per guide id; respect Developer Details off.

## Contextual hints (once each)

| Guide id | Trigger | Message theme |
| -------- | ------- | ------------- |
| `first-selection` | first select | task menu intro |
| `table-parts` | table root menu only (not cell/header sub-screens) | pick Title/Headers/Rows first |
| `chart-polish` | chart host | title/subtitle/card only |
| `button-spacing` | button select | margin chips, no canvas drag |
| `layout-row` | container + guidance | pick heading via banner |

Update copy to say **Preview Changes** / **Apply to Code** (not Validate/Apply).

---

# 14. Acceptance scenarios

**Tester profile:** new user, **Developer Details off**, TailAdmin (`pnpm dev:tailadmin`).

Record Pass? in [`DOGFOOD.md`](DOGFOOD.md) § v0.5.0-beta.0 and § v0.5.0 stable.

**Out of v0.5 DoD:** Next.js scenario (v0.4 #10) — appendix only.

---

## A. Required for `0.5.0-beta.0`

Beta proves the **core vibe-coder loop** on **Cards + Tables** — not the whole dashboard.

| # | Task | Pass criteria |
| - | ---- | ------------- |
| B1 | Change card **Label** text | Task menu → Label → edit → Preview Changes → Apply to Code → HMR |
| B2 | Change card **Value** text | Task menu → Value → edit → Apply to Code |
| B3 | Change **Card Style** | Background and/or Padding → Preview shows plain language → Apply |
| B4 | Change **Table Title** | Table task menu → Table Title → edit “Recent Orders” |
| B5 | Rename table column | Column Headers → “Products” → “Items” → Apply updates source |
| B6 | Edit static row text (Engine Tier C) | Rows → first row → cell Text → `tableData` updated in source |
| B7 | **Preview Changes** human-readable | Shows “Background: … → …” or “Padding: … → …” — no `mergeTailwind`, utilities, or op names |
| B8 | **Apply to Code** | Source file updates; HMR reflects change |
| B9 | **Undo** | Reverts last applied change |
| B10 | Unsupported edit | One plain reason + **Copy Fix Prompt** only (no file path in panel) |
| B11 | **Screenshot review** | §15 all required shots (SS1–SS10) pass Rule 0 gate |
| B12 | Rule 0 audit | No raw ids, className, utilities, paths, AST, or patch jargon anywhere in Simple Mode during B1–B10 |

---

## B. Required for `0.5.0` stable

Everything in **§14 A**, plus:

| # | Task | Pass criteria |
| - | ---- | ------------- |
| S1 | **Button** text + color | Button task mode on instrumented button |
| S2 | **Form** label edit | P-C instrumented field — label changes in source |
| S3 | **Navigation** label | P-E — at least one sidebar link label |
| S4 | **Chart** title/subtitle/card | Chart mode on `chart.sales.*` |
| S5 | **Section/landing** block | P-F — heading + description on demo-app or TailAdmin |
| S6 | Breakpoint edit | Card or table style at Tablet — human breakpoint label |
| S7 | Hide / Show | Table Style or Card Style hide toggle |
| S8 | **10-minute new user** | Fresh clone + [`nuvioUser.md`](nuvioUser.md) only; first edit without this doc |
| S9 | **Second external dogfood** | New tester, no internal docs; results in DOGFOOD.md |
| S10 | Full P-C–P-F instrumentation | §12 gap table all ✅ |
| S11 | **Screenshot review** (stable) | §15 SS11–SS14 + marketing-ready card/table flows |

---

# 15. Screenshot acceptance

Screenshot review is a **hard gate** for beta and stable. Capture with **Developer Details OFF** at 1440×900 (or consistent viewport). Store in `docs/screenshots/v0.5/` or release PR.

## Required screenshots — beta (`0.5.0-beta.0`)

| # | Screen | Must show | Must NOT show |
| - | ------ | --------- | ------------- |
| SS1 | Orders Card root menu | Task menu: Label · Value · Card Style; “What would you like to change?” | Raw ids, Device section |
| SS2 | Card **Label** task | Title `Card Label`; `← Orders Card`; Text + Quick Style | `metric.orders.label`, Text color field in main area |
| SS3 | Card **Card Style** task | Title `Orders Card`; `← Card Options`; Background, Padding, Radius, Shadow | Tailwind tokens, duplicate Advanced |
| SS4 | Recent Orders **table root** | Menu: Title · Column Headers · Rows · Table Style | `orders.section`, table guidance on sub-screens |
| SS5 | **Product Name** edit (direct cell click) | Title `Product Name`; `← Recent Orders Table`; chip `Selected Product Name`; Text + Quick Style | `Row 1 · product name`, `← NameText Table`, `← 2 Table`, Rows ← Back, table guidance |
| SS6 | **Column Header** edit | Title `Products Header` or `Category Header` (not generic `Column Header` when column known); `← Recent Orders Table`; Text + Quick Style | Raw header ids, generic `Column Header` when specific header known |
| SS6b | **Row** selection | Title `Apple Watch Ultra Test Row`, `Apple Watch Ultra Test`, or `Product Row`; `← Recent Orders Table`; chip matches title | `Row 2 · row`, row keys as names |
| SS7 | **Empty state** (before edits) | `No pending changes`; compact action stack | Large empty green preview panel |
| SS8 | **Preview state** (after edit + preview) | Human-readable diff; Apply enabled | `mergeTailwind`, file paths |
| SS9 | **Blocked** edit | One plain sentence + Copy Fix Prompt | Risk labels, unsupportedReason, Open file in main area |
| SS10 | **Advanced** collapsed at bottom only | Single Advanced; Responsive preview Desktop/Mobile inside | Duplicate Advanced, standalone Device section, Outline at top level |

## Additional screenshots — stable (`0.5.0`)

| # | Screen |
| - | ------ |
| SS11 | Form label task (P-C) |
| SS12 | Nav label task (P-E) |
| SS13 | Chart title task |
| SS14 | 10-minute setup — first edit on demo-app |

## Release rule

> **No beta or stable release** is allowed if any required screenshot shows raw ids, `className`, Tailwind tokens, file paths, patch ops, risk labels, duplicate Advanced sections, standalone Device section, or table guidance on table sub-screens in Simple Mode.

**Rule 6 naming blockers** — no Simple Mode screenshot may show:

- `NameText`, `ValueText`, or other implementation suffixes
- `Row 2 · row` or row keys as visible names
- `← 2 Table`, `← NameText Table`, or numeric table parent labels
- Raw id fragments (`orders.row.`, `metric.orders.`, `data-nuvio-id`)

Required naming checks (Developer Details OFF):

| Screen | Title | Back link | Chip |
| ------ | ----- | --------- | ---- |
| Product Name | `Product Name` | `← Recent Orders Table` | `Selected Product Name` |
| Products header | `Products Header` | `← Recent Orders Table` | `Selected Products Header` |
| Row (2nd product) | `Apple Watch Ultra Test Row` or `Product Row` | `← Recent Orders Table` | matches title |
| Card Label | `Card Label` | `← Orders Card` | `Selected Card Label` |
| Card Style | `Orders Card` | `← Card Options` | `Selected Orders Card` |

Reviewer signs checklist in DOGFOOD.md alongside scenario Pass? columns.

---

# 16. Implementation sequence

Complete **Steps 0–7** before tagging `0.5.0-beta.0`. Steps 8+ are **post-beta** (stable only).

| Step | Focus | Engineering | Exit criteria |
| ---- | ----- | ----------- | ------------- |
| **0** | Gate | v0.4 DoD + `pnpm dogfood` | Green CI |
| **1** | **Simple Mode visibility audit** | Grep overlay for user-facing leaks; move behind Developer Details | Rule 0 checklist green |
| **2** | **Trust copy** | Validate → Preview Changes; Apply → Apply to Code | No old labels in Simple Mode; protocol names unchanged |
| **3** | **Human preview** | `human-preview.ts` + tests | B7; SS6; no utilities in Simple Mode preview |
| **4** | **Task router — Cards** | Label / Value / Card Style; reuse pickers + staging | B1–B3, SS1–SS3 |
| **5** | **Task router — Tables** | Wrap `table-panel.tsx`; Title / Column Headers / Rows / Table Style | B4–B6, SS4–SS5; do not rewrite table/index |
| **6** | **Copy Fix Prompt + blocked states** | Wire all `suggestedAction`; one reason + one action | B10, SS7 |
| **7** | **Screenshot acceptance pass** | Capture SS1–SS10; fix any Rule 0 violations | §15 beta gate signed |
| **7b** | **Simple Mode philosophy pass** | Rule 5 layout: human titles, back nav, Quick Style, pending preview, single Advanced, hide Device | SS5–SS7, SS10; [`simple-mode-nav.ts`](../packages/overlay/src/simple-mode-nav.ts) |
| **7c** | **Human naming polish** | Rule 6: back links, row/column titles, chip parity; no id suffix leaks | SS5–SS6b; [`human-naming.ts`](../packages/overlay/src/human-naming.ts) |
| **—** | **→ Ship `0.5.0-beta.0`** | Tag + external feedback | §18.1 complete |
| **8** | Form, Nav, Chart, Section, Button modes | Extend task router | §14 B scenarios |
| **9** | Dogfood P-C–P-F instrumentation | TailAdmin + demo-app ids | §12 stable gap table |
| **10** | Presets v2 + container guidance v2 | Expand presets; multi-choice guidance | Stable polish |
| **11** | Onboarding + docs + npm | nuvioUser, DOGFOOD, CHANGELOG `@0.5.0` | S8, S9 |
| **12** | Stable release | SS9–SS12 + marketing §23 | §18.2 complete |

### Step 1 detail — Simple Mode visibility audit

Search `packages/overlay` for user-facing strings and surfaces that may leak:

- Raw ids (`metric.`, `orders.`, `data-nuvio-id`)
- `className`, Tailwind utilities (`bg-`, `p-`, `text-`, `rounded-`)
- File paths, `:line`, `unsupportedReason`, `caution`, `patchHost`
- `textTarget`, `styleTarget`, `hierarchyRole`, `setText`, `mergeTailwind`
- Validate / Apply (replace per Step 2)

**Likely files:** `PropertyPanelShell.tsx`, `selection-summary.ts`, `ComponentTree.tsx`, `table-panel.tsx`, `component-mode.tsx`, `container-guidance.tsx`, `handoff-actions.tsx`, `OnboardingGuide.tsx`, `selection-guides.ts`

**Exit:** Manual walkthrough B1–B10 with zero Rule 0 violations. Documented in [SIMPLE_MODE_VISIBILITY_AUDIT.md](./SIMPLE_MODE_VISIBILITY_AUDIT.md). Automated regression: `packages/overlay/src/simple-mode-visibility-audit.test.ts`.

### Step 4 detail — Task router (Cards)

1. Add `task-router.tsx`; `PropertyPanelShell` delegates Simple Mode body when not in Developer Details.
2. On `*.card`: menu **Label | Value | Card Style** (Rule 0 labels only).
3. Sub-screens reuse existing text + color pickers + style picks — **do not duplicate patch staging**.
4. Internal `onSelectId` switches target; never expose id strings.
5. Advanced accordion retains v0.4 More styles for power users.

### Step 5 detail — Task router (Tables)

1. Wrap existing [`table-panel.tsx`](../packages/overlay/src/table-panel.tsx) — **do not rewrite**.
2. Rename sub-targets to Rule 0 labels: Table Title, Column Headers, Rows, Table Style.
3. Row list uses friendly labels from index metadata (`product.name`), not `orders.row.1`.
4. Do not change `packages/vite-plugin` index v4 or `setTableDataField`.

### Step 9 detail — Stable instrumentation (post-beta)

1. `MonthlyTarget.tsx`, `DemographicCard.tsx`: title + card ids only.
2. `AppSidebar.tsx`: ≥1 nav link id.
3. Forms: complete label + input pairs.
4. Update `apps/tailadmin-dogfood/README.md` id table.

---

# 17. Test matrix

### Required before `0.5.0-beta.0`

| Area | Check |
| ---- | ----- |
| Overlay | Step 1 visibility audit documented (grep list + fixes) |
| Overlay | Task router: card + table modes (RTL/snapshot) |
| Overlay | Human preview unit tests — includes no-token fallback |
| Overlay | Plain messages + blocked states → Copy Fix Prompt |
| Overlay | Carry v0.4 tests (container guidance, selection-guides) |
| ast-engine | Carry `v04-*` fixtures; no regression |
| vite-plugin | Carry index v4 tests; **no changes required for beta** |
| TailAdmin | §14 A (B1–B12) |
| Screenshots | §15 SS1–SS10 signed |
| `pnpm dogfood` | Green |

### Required before `0.5.0` stable

| Area | Check |
| ---- | ----- |
| Overlay | Form, Nav, Chart, Section, Button task modes |
| TailAdmin | §14 B (S1–S11) |
| demo-app | 10-minute setup (S8) |
| TW v3 + v4 | demo-app + tailadmin + tailwind-v4-test |
| Screenshots | §15 SS11–SS14 |
| Handoff | Clipboard payload includes file, line, id (panel stays Rule 0 clean) |
| COMPATIBILITY | Vite public; Next experimental footnote |
| No P0 | Wrong file/node, broken undo, invisible editor |
| DOGFOOD.md | Beta + stable scenarios and screenshots recorded |
| Second dogfood | S9 documented |

---

# 18. Definition of done

### 18.1 `0.5.0-beta.0` (public beta)

Ship when the **core vibe-coder loop** works on **Cards + Tables** only.

**Engineering status (overlay — code complete, manual sign-off pending):**

- [x] Task router: Card + Table modes (Steps 4–5)
- [x] Trust copy: Preview Changes / Apply to Code (Step 2)
- [x] Human preview (Step 3)
- [x] Rule 5 Simple Mode pass: human titles, back nav, Quick Style, pending preview, single Advanced, Device in Advanced (Step 7b)
- [x] Rule 6 human naming pass: back links, row/column titles, chip parity; no id suffix leaks (Step 7c)
- [x] Copy Fix Prompt wiring (Step 6)
- [x] `pnpm dogfood` green
- [x] Step 1: Simple Mode visibility audit — [SIMPLE_MODE_VISIBILITY_AUDIT.md](./SIMPLE_MODE_VISIBILITY_AUDIT.md)
- [x] §14 A scenarios B1–B12 pass — [DOGFOOD.md](./DOGFOOD.md) § v0.5.0-beta.0
- [x] §15 screenshots SS1–SS10 + SS6b — [screenshots/v0.5/](./screenshots/v0.5/) (Rule 6 naming verified 2026-05-31)
- [x] CHANGELOG + nuvioUser.md updated for beta

**Explicitly NOT required for beta:** Form, Nav, Chart, Section, Button task modes; P-C–P-F instrumentation; preset v2 expansion; 10-minute demo-app path; external dogfood pass.

### 18.2 `0.5.0` stable (public release)

Everything in beta, plus:

- [x] Task router: Button, Form, Nav, Chart, Section modes (Step 8)
- [x] P-C, P-D, P-E, P-F instrumentation complete (Step 9) — see §12 gap table
- [x] §14 B scenarios S1–S11 pass — [DOGFOOD.md](./DOGFOOD.md) § v0.5.0 stable + `pnpm v05:acceptance:stable`
- [x] §15 screenshots SS11–SS14 — [screenshots/v0.5/](./screenshots/v0.5/) (`SS14` via demo-app)
- [x] S8 10-minute new user documented — [nuvioUser.md](./nuvioUser.md) + [apps/demo-app/README.md](../apps/demo-app/README.md)
- [x] S9 second external dogfood pass documented — template in [DOGFOOD.md](./DOGFOOD.md) § v0.5.0 stable
- [x] npm `@nuvio/*` at `0.5.0`
- [x] COMPATIBILITY + LIMITATIONS aligned with §3
- [x] Marketing assets §23 (minimum: 2 demo videos) — [marketing/VIDEO_SCRIPTS_v0.5.md](./marketing/VIDEO_SCRIPTS_v0.5.md)

### Known v0.4 carry-over exceptions (document if still open)

- [ ] v0.4 manual §9 scenarios fully signed in DOGFOOD.md
- [ ] npm versions may still show `0.4.x` until stable publish

---

# 19. Package touchpoints

| Package | Beta (`0.5.0-beta.0`) | Stable (`0.5.0`) |
| ------- | --------------------- | ------------------ |
| `packages/overlay` | Visibility audit, trust copy, human preview, task router (card + table), Copy Fix Prompt, **Rule 5 Simple Mode pass** (`simple-mode-nav`, `simple-mode-actions`, Quick Style, single Advanced) | + form/nav/chart/section/button modes, presets v2, onboarding |
| `packages/shared` | **No protocol bump** | Same |
| `packages/vite-plugin` | **No changes** — index v4 carry forward | Maintenance only |
| `packages/ast-engine` | **No changes** — carry `v04-*` fixtures | Preset golden tests if expanded |
| `packages/next` | Out of public scope | Out of public scope |
| `apps/tailadmin-dogfood` | P-A + P-B verify only | P-C–P-F instrumentation (§12) |
| `apps/demo-app` | Optional smoke | 10-minute setup path (S8) |
| `apps/tailwind-v4-test` | Regression gate | Regression gate |
| `docs/*` | DOGFOOD beta, CHANGELOG beta | Full public docs + screenshots |

**Carry forward — do not rebuild:**

- Index v4, `setTableDataField`, `rowTargets`, `tableMeta`
- Plain patch message map (extend only)
- WebSocket protocol v7 / patchApply / dryRun / undo
- Shadow DOM overlay, device breakpoints, Outline/tree
- Table sub-targets (`table-panel.tsx`) — wrap, don’t rewrite
- Fix handoff payload (`fix-handoff.ts`) — rename UI only

**Implementation lock:** overlay/vite-plugin/shared/ast-engine scopes per [`.nuvio/implementation-lock.json`](../.nuvio/implementation-lock.json). User must unlock for v0.5 overlay work.

---

# 20. Risk register

| Risk | Mitigation |
| ---- | ---------- |
| Simple Mode leaks engine strings | Step 1 visibility audit + §15 screenshot gate (Rule 0) |
| Task router duplicates Quick edits logic | Single picker components; router is navigation only |
| Human preview shows Tailwind tokens | Generic fallback labels (“Background changed”); utilities in Developer Details only |
| Beta scope creep (forms/nav before stable) | §18.1 explicit NOT required list; ship beta after Steps 0–7 only |
| Public users hit uninstrumented blocks | Beta: cards + tables only; stable: complete §12 gap table |
| Over-promising “forms/nav complete” at beta | Marketing waits for §18.2 |
| Presets drop existing utilities | Golden tests per preset (stable) |
| Marketing before dogfood signed | Gate beta on §18.1 + §15 |
| Tier terminology confusion | Engine vs P- prefix (§4) |
| Simple mode hides real blockers | Never hide errors; always one action (Rule 3) |
| Tree desync from canvas | Single `selectId` source of truth |
| UX regression for power users | Advanced + Developer Details retain v0.4 depth |

---

# 21. Explicit deferrals

| Item | Target |
| ---- | ------ |
| Next.js public support | v0.6+ or experimental indefinitely |
| Duplicate / create / insert JSX | v0.6+ |
| Design token file sync | v0.6+ |
| Full `cn()` / template literal classNames | v0.6+ (optional expanded flag) |
| Semantic Button/Badge variant editing | v0.6+ |
| Chart series / Apex options / graph colors | not v0.5 — handoff |
| Canvas drag-and-drop | not planned |
| In-panel AI chat | not planned — Copy Fix Prompt only |
| Production runtime editing | v0.8+ |
| Cloud / teams | v0.8+ |

---

# 22. Behavior rules

Carry forward from v0.4 §15:

0. **Rule 0 (Simple Mode visibility)** — see §2; enforced by Step 1 audit and §15 screenshots.
0b. **Rule 5 (three-question layout)** — see §2; enforced by Step 7b and SS5–SS7, SS10.
1. **Explicit over silent** — never patch duplicate or unknown ids.
2. **Simple mode = tasks** — Developer Details = engine truth.
3. **Never silently redirect style patches** between host and child.
4. **When stuck → Copy Fix Prompt** — do not grow an AI editor inside Nuvio.
5. **Engine Tier C only when index proves data binding** — fail-closed otherwise.
6. **Instrument before claiming** — stable public tiers require ids in §7.

**Do not rebuild:** protocol v7, index v4, `setTableDataField`, `rowTargets`, `tableMeta`, `patchApply` / `dryRun` / undo stack, [`table-panel.tsx`](../packages/overlay/src/table-panel.tsx).

## Final instruction for implementers

```text
1. Confirm v0.4 engineering DoD is green (pnpm dogfood).
2. Start §16 Step 1 (Simple Mode visibility audit) — blocks release if skipped.
3. Steps 2–6: trust copy → human preview → card router → table router → Copy Fix Prompt.
4. Step 7: screenshot pass (§15) — no beta without SS1–SS10 clean.
5. Step 7b: Rule 5 philosophy pass — human titles, back nav, Quick Style, no Device in default view.
6. Ship 0.5.0-beta.0 after §18.1 only (cards + tables).
7. Post-beta: Steps 8–12 for stable (forms, nav, chart, section, full dogfood).
8. Do not relax fail-closed patching; v0.5 is overlay UX + docs + instrumentation.
9. Update nuvioUser.md — vibe coders won’t read this doc.
```

---

# 23. Appendix — Marketing & success metrics

## Positioning

**Never market:** Visual React editor · AST patching tool

**Market:** Stop wasting AI tokens on UI tweaks.

## Launch audience

1. AI-assisted IDE users  
2. v0 users  
3. Lovable / Bolt users  
4. Indie hackers  
5. Replit builders  

## Demo videos

**Beta:** Video 1 (card spacing) + Video 2 (table title) sufficient for early testers.

**Stable (minimum):**

### Video 1 — Card spacing

Prompt: “Make this card smaller” vs Nuvio: Click → Card Style → Padding → Preview → Apply.

### Video 2 — Table title

Recent Orders → Latest Purchases via Table → Title.

### Video 3 — Mobile spacing

Tablet mode → adjust section padding → Preview → Apply.

## Success metrics (90 days post-stable)

| Metric | Target |
| ------ | ------ |
| Active users | 100 |
| Weekly active | 20 |
| Public testimonials | 10 |
| YouTube reviews | 5 |
| Template partnerships | 3 |

**Primary metric:** Number of UI changes completed **without leaving the browser for manual code edits**.

## v0.5.0 definition of success (product)

A founder with no React expertise can:

1. Install Nuvio  
2. Open localhost  
3. Click a card  
4. Change text and styling via task menu  
5. Preview and apply changes  
6. Continue building  

…without understanding Tailwind, ASTs, JSX patching, or source indexing.

If that experience feels magical, v0.5.0 succeeds.

---

## Appendix B — Copy Fix Prompt example

```text
Nuvio could not apply this edit safely.

Component: RecentOrders (orders.table)
File: src/components/ecommerce/RecentOrders.tsx:98
You tried: change text on the table wrapper
Reason: This element is a layout container, not editable text.

Suggested next step: Select "Recent Orders" title or add data-nuvio-id="orders.title" on the heading.

Optional prompt (paste into your editor or AI assistant):
"In RecentOrders.tsx, add data-nuvio-id orders.title to the Recent Orders heading and ensure the title text is a string literal."
```

---

## Appendix C — Experimental Next.js (not public v0.5)

For maintainers only:

```bash
pnpm dev:next   # apps/next-dogfood, port 3001
```

Do not include in public setup docs, npm README, or v0.5 acceptance scenarios. Revisit for v0.6 if App Router parity is prioritized.
