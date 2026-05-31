# Nuvio v0.4.0 — Vibe-coder experience (release plan)

**Document status:** Implementation spec for v0.4.0 (start after v0.3.0 stable DoD).  
**Release target:** `0.4.0-alpha.0` (experience + workflow), then `0.4.0` stable (+ Next.js adapter).  
**Prerequisite:** v0.3.0 stable per [`docs/nuvio_v0.3.0.md`](nuvio_v0.3.0.md) §10.2 (`pnpm dogfood`, TailAdmin dogfood, picker sync).  
**Companions:** [`docs/PRD.md`](PRD.md), [`docs/nuvioUser.md`](nuvioUser.md), [`docs/LIMITATIONS.md`](LIMITATIONS.md), [`docs/COMPATIBILITY.md`](COMPATIBILITY.md), [`docs/OVERLAY_PICKER_SYNC.md`](OVERLAY_PICKER_SYNC.md).

v0.3.0 delivered **stack mastery** on React + Tailwind + Vite (targets, Tailwind depth, breakpoints, safe patching).  
v0.4.0 delivers **reach and simplicity** so **vibe coders** — the primary audience — can polish AI-generated UIs without reading engine diagnostics or fighting container dead-ends.

---

## 0. North star

### Who we build for

**Vibe coders** use Cursor, v0, Lovable, Bolt, or similar to generate apps, then spend most of their time on small visual tweaks:

- Change a title or metric value
- Adjust spacing, colors, or hide a block
- Fix “looks wrong on mobile”
- Hand off to AI when Nuvio cannot patch safely

They do **not** want to learn Tailwind merge rules, AST risk levels, or breakpoint bucket semantics on day one.

### Core principle

```text
Tasks, not tokens.
Progressive disclosure, not two products.
One handoff path when Nuvio stops.
```

| Principle | Meaning |
| --------- | ------- |
| **Default = task-focused** | Simple mode answers: *Can I edit this?* → *What can I change?* → Validate → Apply |
| **Details = opt-in** | File paths, risk, `className` literal type, stack versions → **Developer details** only |
| **Never hide blockers** | If editing is blocked, one plain sentence + **one next step** (switch target, add id, copy for Cursor) |
| **Same engine, calmer UI** | v0.4 does not relax fail-closed patching; it improves guidance and surface area |

### v0.4.0 product promise

> **Nuvio lets vibe coders polish every common dashboard block — cards, tables, charts, nav, forms, buttons — without learning Tailwind internals or hitting silent dead-ends.**

On a typical AI-generated dashboard (TailAdmin-class template):

```text
Click the thing you care about → edit text / colors / spacing (or get guided to the right part)
  → Validate → Apply → HMR
```

That includes **tables**: section title, column headers, row content, and row/section styles — not only metric cards.

If Nuvio cannot patch safely (e.g. dynamic `cn()`):

```text
One click → copy context for Cursor (file, component, id, what you tried, plain reason)
```

**Honest boundary:** v0.4 covers **all standard dashboard UI patterns** when instrumented with the recommended id contract (§4). It does not claim arbitrary React apps or every expression shape without ids or static literals.

### What v0.4.0 claims (honest)

| Claim | Meaning |
| ----- | ------- |
| **Simple mode is the product** | Routine polish never requires Developer details |
| **Smart selection** | Containers suggest editable children (titles, labels, values) |
| **Quick edits first** | Text, colors, padding, radius, hide — before 20 dropdowns |
| **Works on Vite + Next dev** | Same `data-nuvio-id` contract; Next adapter in safe mode |
| **AI handoff** | Copy fix context / open in editor at line |
| **Hierarchical picker** | Tree v2: find “Recent Orders title” without guessing the blue box |
| **Tables & rows** | Section, headers, static row data, row styles — vibe-simple targets |
| **Component coverage** | Cards, tables, charts, nav, forms, buttons, badges (§4 tiers) |

### What v0.4.0 does **not** claim

- Full Figma-like layout or free-form drag-and-drop
- Every `className` pattern (`cn()` templates, CSS modules, arbitrary properties)
- In-panel AI chat or auto-apply from prompts
- Public duplicate / create / insert JSX in the editor
- Design-token files or app-wide theme sync (v0.5+)
- Production runtime editing or team cloud (v0.8+)

---

## 1. Roadmap position

| Phase | Release | Goal | Key capabilities |
| ----- | ------- | ---- | ---------------- |
| **A — Reliability** | **v0.2.0** ✅ | Overlay + index trust | Shadow DOM, diagnostics, Tailwind v4 |
| **B — Stack mastery** | **v0.3.0** | React + TW + Vite depth | Targets, TW controls, breakpoints, golden tests |
| **C — Vibe-coder UX** | **v0.4.0** ← **this doc** | Simple, guided, handoff | Quick edits, tree, smart targets, Next.js, workflow |
| **D — Design system** | **v0.5+** | Consistency | Tokens, semantic components, theme |

```text
v0.2.0  reliability
   ↓
v0.3.0  editability + Tailwind + responsive + hardening
   ↓
v0.4.0  vibe-coder experience + Next.js + AI handoff   ← THIS DOC
   ↓
v0.5+   design tokens / semantic editing
```

**Gate:** Do **not** start v0.4.0 implementation until v0.3.0 §10.2 stable DoD passes (`pnpm dogfood`, TailAdmin acceptance, no P0 regressions).

---

## 2. Why v0.4.0 exists (gaps after v0.3)

v0.3 proved the **engine**. Vibe coders still hit **experience** gaps:

### Gap 1 — Wrong click feels like failure

Example: select `orders.table` (wrapper `div` in `RecentOrders.tsx`).

- Panel shows: “Text not editable (container)”
- User wanted: change **“Recent Orders”** title or table card background
- Engine is correct; **UX is not guiding** to `chart.sales.title`-style child ids or `textTargets`

### Gap 2 — Too much detail in the default path

Simple mode still surfaces expert concepts:

- Risk: caution, `className patchable (string literal)`
- Long breakpoint / target conflict paragraphs
- Full Typography + Spacing + Layout + Visual wall on every selection

Vibe coders need **3–5 high-impact controls** first; the rest behind **More styles**.

### Gap 3 — Stack reach (Next.js)

Many vibe apps are **Next.js** (App Router or Pages). Without a dev adapter, v0.4 feels “not for my project.”

### Gap 4 — Dead-end without handoff

When patch is blocked, users paste screenshots into Cursor with no structured context. v0.4 adds **copy fix context** and optional **open in editor**.

### Gap 5 — Tables and rows are effectively broken today

Today on TailAdmin **Recent Orders**:

| User tries | What happens (v0.3) |
| ---------- | ------------------- |
| Click table area (`orders.table`) | Wrapper only — **text not editable**; style panel confusing |
| Change “Recent Orders” title | No id on `<h3>` — not in index as target |
| Edit column headers (“Products”, “Price”) | No ids on header cells |
| Edit “MacBook Pro” in a row | Cell text is `{product.name}` — **not a string literal**; inside `.map()` → caution |
| Change row spacing / colors | No `data-nuvio-id` on `<TableRow>` |

Vibe coders experience this as **“Nuvio doesn’t work on tables.”** v0.4 must fix the **full table story** (section + headers + rows), not only a guidance banner on the wrapper.

---

## 3. Release pillars (v0.4.0)

Four pillars — product-facing names map to engineering tracks.

### Pillar 1 — Smart selection (reduce dead-ends)

**Outcome:** Clicking a container never feels like a dead end.

| # | Deliverable | Notes |
| - | ----------- | ----- |
| 1.1 | **Container guidance banner** | Plain copy + primary action: “Edit the **Recent Orders** title instead?” |
| 1.2 | **Auto-suggest text target** | Use index `textTargets[]` + DOM heuristics (`h1–h6`, first `p`/`span` with text) |
| 1.3 | **Component-aware panel header** | Card / Table / Chart / Form / Button — changes Quick edits labels (not new patch types) |
| 1.4 | **Tree v2 (hierarchical inspector)** | Host-grouped list; friendly labels; click to select; optional hover outline |
| 1.5 | **Friendly ids in simple mode** | `orders.table` → “Recent Orders table”; hide raw ids unless Developer details |

**Behavior rules:**

- Never silently redirect style patches between host and child (v0.3 policy holds).
- Guidance may **switch UI selection** to a child id; user confirms or one-clicks.

### Pillar 2 — Simple editing surface (tasks, not tokens)

**Outcome:** Routine polish in under 2 minutes without Developer details.

| # | Deliverable | Notes |
| - | ----------- | ----- |
| 2.1 | **Quick edits** (always visible) | Text, Text color, Background, Padding, Radius, Hide/Show |
| 2.2 | **More styles** (collapsed) | Full v0.3 groups: Typography, Spacing, Layout, Visual |
| 2.3 | **Style presets** (whitelist-backed) | “Tighter spacing”, “Card emphasis”, “Muted text” → safe utility bundles |
| 2.4 | **Plain breakpoint label** | “Applies on: **Desktop (xl)**” alongside technical Active BP |
| 2.5 | **Picker sync polish** | Current colors/values in controls (`dark:`, `xl:`, opacity) — see `OVERLAY_PICKER_SYNC.md` |
| 2.6 | **Status chip** | Connected / selected / safe-to-edit — one line; versions only in Developer details |

**Simple mode panel order (canonical):**

```text
1. Selection summary (friendly name + “what you can edit here”)
2. Quick edits
3. Text (if editable or guided)
4. Device + breakpoint (compact)
5. Structure (Hide / Show / Move — when allowed)
6. More styles ▼
7. Validate / Apply / Undo
```

**Hide in simple mode (Developer details only):**

- Vite / React / Tailwind version block in panel header
- `className patchable (string literal)`
- Raw `data-nuvio-id` strings (use friendly labels)
- Risk: caution verbatim (replace with “Styles: OK” / “Text: pick a label below”)

### Pillar 3 — Works where vibe coders build (Next.js)

**Outcome:** “Works in my Next app dev server” with the same mental model as Vite.

| # | Deliverable | Notes |
| - | ----------- | ----- |
| 3.1 | **Next.js adapter** | `@nuvio/next` or documented plugin mode — **one** mode first (choose Pages **or** App Router client components) |
| 3.2 | **Dogfood app** | `apps/next-*-dogfood` with `data-nuvio-id` on card + table title pattern |
| 3.3 | **COMPATIBILITY.md** | Matrix row for Next 14/15 dev |
| 3.4 | **Simple unsupported copy** | “This page isn’t in Nuvio dev mode” vs stack jargon |

**Defer within v0.4:** second Next mode, RSC server components, middleware edge cases.

### Pillar 4 — Clean AI handoff (workflow)

**Outcome:** When Nuvio stops, vibe coders unblock in one Cursor prompt.

| # | Deliverable | Notes |
| - | ----------- | ----- |
| 4.1 | **Copy fix context** | Clipboard: file, line, component, id, user intent, plain `unsupportedReason`, snippet hint |
| 4.2 | **Open in editor** (optional) | `cursor://` or `vscode://` link where OS supports; fallback: path + line only |
| 4.3 | **Mapped plain errors** | Top 15 `unsupportedReasons` → one sentence + suggested action |
| 4.4 | **Telemetry impl (opt-in)** | Per `docs/TELEMETRY.md`: mode simple/developer, handoff clicks — no source by default |

**Explicitly out of v0.4.0:**

- In-overlay AI chat
- Auto-apply from pasted prompts
- Whole-file rewrite assist

**v0.4.x optional:** scoped prompt-assist (selection-bound, never whole-file).

### Pillar 5 — Universal dashboard components (tables, rows, and common UI)

**Outcome:** Vibe coders can polish **the same UI blocks AI templates generate** — not only metric cards.

| # | Deliverable | Notes |
| - | ----------- | ----- |
| 5.1 | **Component modes** | Panel adapts by kind: Card, **Table**, Chart, Nav, Form, Button |
| 5.2 | **Table section contract** | Document + dogfood ids for card, title, actions, table wrapper |
| 5.3 | **Column header editing** | Indexed header cells; edit header text + header styles |
| 5.4 | **Row targeting** | Click row → outline shows “Row 3 · MacBook Pro”; explicit patch target |
| 5.5 | **Static row data editing** | Patch `const tableData = [...]` string fields when cells use `{item.x}` |
| 5.6 | **Row / cell styles** | `data-nuvio-id` on `TableRow` or cell hosts with literal `className` |
| 5.7 | **“Make table editable” handoff** | One-click Cursor snippet to add §4.2 ids + row template |

**Policy (unchanged):** fail-closed on ambiguous `.map()` writes; v0.4 adds **safe paths** instead of blocking with jargon only.

---

## 4. Universal component editing (vibe-coder coverage)

### 4.1 Coverage tiers

Not every React pattern is equal. v0.4 ships **three tiers** so vibe coders know what works out of the box.

| Tier | What vibe coders can do | Requirements |
| ---- | ------------------------ | ------------ |
| **A — Always** | Edit text + styles on a selected host with literal `className` and string-literal text | `data-nuvio-id` on that element |
| **B — Guided** | Click container → banner/tree sends them to title, header, or child target | Parent id + `textTargets` / tree (Pillar 1) |
| **C — Table data** | Edit cell copy that comes from `const data = [...]` in the same file | Index links map → data literal; new patch path (§4.3) |

**v0.4 stable goal:** TailAdmin dashboard passes **Tier A + B** for all patterns in §4.4; **Tier C** for Recent Orders static `tableData`.

### 4.2 Table section — recommended id contract

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
          {/* ... price, status */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((product) => (
          <TableRow
            key={product.id}
            data-nuvio-id={`orders.row.${product.id}`}
            className="..."
          >
            <TableCell data-nuvio-id={`orders.row.${product.id}.name`} className="...">
              <p className="..." data-nuvio-id={`orders.row.${product.id}.nameText`}>
                {product.name}
              </p>
              ...
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>
```

**Simple-mode labels:** “Recent Orders section”, “Column: Products”, “Row: MacBook Pro”, not raw ids.

### 4.3 Row content — why v0.3 fails and how v0.4 fixes it

| Cell content in source | v0.3 | v0.4 approach |
| ---------------------- | ---- | ------------- |
| String literal (`Products`) | ✅ `setText` | ✅ Quick edits |
| Expression (`{product.name}`) | ❌ not patchable | **Tier C:** patch matching field in `tableData` array |
| Badge / custom component | ⚠️ | Edit literal children or handoff |
| Dynamic list from API | ❌ | Handoff: “wire ids when data is stable” |

**Index v4 (vite-plugin):**

- `tableMeta`: `{ dataBinding: "tableData", file, line, columns[] }` when map reads a local `const` array.
- `rowTargets[]`: `{ rowKey, nuvioId, label, file, line }` from `orders.row.${id}` pattern.
- `insideMap: caution` remains; patch allowed when **target id is explicit** and text patch resolves to **data literal** or **literal JSX child**.

**AST / patch (ast-engine):**

- `setTableDataField` op (v0.4): `{ hostId, rowKey, field, value }` → updates string in `tableData` entry.
- Golden fixture: `v04-recent-orders-table-data.ts`.

### 4.4 Dashboard UI pattern matrix (v0.4 target)

| UI pattern | Vibe tasks | v0.3 | v0.4 target |
| ---------- | ---------- | :--: | :---------: |
| **Metric cards** | Label, value, colors | ✅ | Tier A — Quick edits |
| **Section cards** | Title, bg, padding | ✅ | Tier A + presets |
| **Tables (section)** | Title, buttons, card style | ⚠️ | Tier A + B — full §4.2 contract |
| **Tables (headers)** | Rename columns, header style | ❌ | Tier A — `orders.header.*` ids |
| **Tables (rows)** | Cell text, row style | ❌ | Tier C + row ids — §4.3 |
| **Charts** | Title, subtitle, card | ⚠️ | Same as table section |
| **Sidebar / nav** | Item labels | ⚠️ | Tree + Tier A per link id |
| **Forms** | Label, placeholder | ⚠️ | Form mode + `*.label` / `*.input` |
| **Buttons** | Label, colors | ⚠️ | Tier A when literal `className` |
| **Badges** | Status text | ⚠️ | Tier A on badge host or handoff |
| **Page title** | H1 copy | ✅ if id | Tree + auto text target |
| **Lists / maps (generic)** | Row copy | ⚠️ caution | Tier C when data binding found; else handoff |
| **Dynamic `cn()`** | Colors | ❌ | Handoff + `cn-basic` if enabled |

### 4.5 Table editing UX (simple mode)

When selection resolves to **Table** component mode, show:

```text
Editing: Recent Orders table
├── Section (title, buttons, card background)   ← default if user clicked wrapper
├── Column headers                              ← pick from dropdown
└── Rows                                        ← click row on canvas or pick from list
      └── Cell text (when Tier C applies)
```

| Control | Applies to |
| ------- | ---------- |
| Quick edits (bg, padding, radius) | Active target (section / header / row) |
| Text | Title, header text, or data-bound cell |
| Hide | Section or single row host (if id on row) |

**Never** show 20 property dropdowns before the user picks **what part of the table** they mean (section vs header vs row).

### 4.6 Other components (same rules)

| Component | Default targets in simple mode |
| --------- | ------------------------------ |
| **Chart** | Title → subtitle → card container |
| **Nav / sidebar** | Link label (per id); section title |
| **Form** | Label → input placeholder (when literal) |
| **Button** | Button text; then colors on button host |
| **Badge** | Badge text child or badge host styles |

### 4.7 Instrumentation checklist (dogfood + `nuvioUser.md`)

| Pattern | Required ids (minimum) |
| ------- | ---------------------- |
| Metric card | `{host}.card`, `{host}.label`, `{host}.value` |
| **Table block** | `{host}.section`, `{host}.title`, `{host}.table`, `{host}.header.*`, `{host}.row.{key}` |
| Chart block | `{host}.card`, `{host}.title`, `{host}.subtitle` |
| Nav item | `{host}.nav.{item}` |
| Form field | `{host}.label`, `{host}.input` |

**v0.4 dogfood exit:** §9 scenarios **including table header + row cell** — without Developer details.

---

## 5. Scope matrix

| Capability | v0.3.0 | v0.4.0 | v0.5+ |
| ---------- | :----: | :----: | :---: |
| **Experience** | | | |
| Quick edits + More styles collapse | | ✅ | |
| Container → child guidance | | ✅ | |
| Component-aware panel headers | | ✅ | |
| Style presets (whitelist) | | ✅ | |
| Tree v2 inspector | | ✅ | |
| Plain breakpoint labels | | ✅ | |
| **Tables & rows (Pillar 5)** | | | |
| Table section + header ids (Tier A/B) | | ✅ | |
| Table component mode in panel | | ✅ | |
| Static `tableData` cell editing (Tier C) | | ✅ | |
| Row list + row/cell styles | | ✅ | |
| Index v4 `tableMeta` / `rowTargets` | | ✅ | |
| **Platform** | | | |
| Vite dev (full) | ✅ | ✅ | |
| Next.js dev adapter | | ✅ (one mode) | second mode |
| **Workflow** | | | |
| Copy fix context for Cursor | | ✅ | |
| Open in editor link | | ✅ opt | |
| Scoped prompt-assist | | | v0.4.x |
| **Engine (carry v0.3)** | | | |
| textTargets / styleTargets | ✅ | ✅ | |
| Breakpoint-aware patch | ✅ | ✅ | |
| `cn()` flag subset | ✅ opt | ✅ | broader v0.5 |
| **Defer** | | | |
| Duplicate / create / insert JSX (public UI) | | | v0.5+ |
| Design token sync | | | ✅ |
| In-panel AI chat | | | ❌ |
| Full semantic shadcn variant editing | | | v0.5 |

---

## 6. Layout helpers (v0.4 scope — simplified)

v0.3 exposes raw utilities (`justify-between`, `flex-col`). v0.4 adds **buttons that map to whitelist ops**:

| Vibe label | Maps to (examples) |
| ---------- | ------------------- |
| Stack vertically | `flex-col` |
| Row layout | `flex-row` |
| Center content | `justify-center` `items-center` |
| Space between | `justify-between` |
| Full width | `w-full` |

Ship in **More styles → Layout** or a compact **Layout** row under Quick edits. Still source-backed; still validate → apply.

**Defer:** visual grid drag, free-form resize, absolute positioning.

---

## 7. Implementation sequence

Complete in order. **Pillar 2 (UX)** can start on Vite-only before Next (Pillar 3).

| Step | Pillar | Engineering focus | Product outcome |
| ---- | ------ | ----------------- | --------------- |
| **0** | — | Finish v0.3.0 §10.2 stable DoD | Gate v0.4 |
| **1** | 2 | Quick edits + More styles collapse; panel reorder | Calmer default panel |
| **2** | 2 | Plain messages for top 15 unsupported reasons | No jargon dead-ends |
| **3** | 1 | Container guidance + one-click child target | Tables/charts titles work |
| **4** | 5 | TailAdmin table instrumentation (§4.2) | Recent Orders fully id’d |
| **5** | 5 | Table component mode + header/section targets | Headers + title editable |
| **6** | 5 | Index v4 `rowTargets` + row picker in panel | Click row → edit row |
| **7** | 5 | `setTableDataField` + Tier C cell text | Edit “MacBook Pro” in place |
| **8** | 1 | Friendly id formatting everywhere in simple mode | Readable selection |
| **9** | 2 | Style presets + plain breakpoint labels | “Make it pop” without TW study |
| **10** | 1 | Tree v2 inspector (index-backed) | Find section/header/row in outline |
| **11** | 4 | Copy fix context + “Make table editable” snippet | Cursor handoff |
| **12** | 3 | Next adapter (one mode) + `apps/next-*-dogfood` | Next dev works |
| **13** | 2 | Layout helper buttons | Row/column without tokens |
| **14** | — | Dogfood + docs + changelog `0.4.0` | Vibe-coder release |

**Do not start Step 12 (Next) until Steps 1–7 pass on TailAdmin (including table row cell edit).**

### Step 1 — Quick edits shell

1. Split `PropertyPanelShell` sections: Quick edits vs More styles (`<details>` or accordion).
2. Quick edits: Text, Text color, Background, Padding, Radius (reuse existing pickers).
3. Move Typography / Layout / Visual groups under More styles (collapsed by default).
4. Simple mode: hide version block from panel header; move to Developer details.

**Exit:** TailAdmin metric card editable with Quick edits only; zero Developer details toggles.

### Step 2 — Plain error map

1. Extend `formatPatchUserMessage` / unsupported reason table.
2. One sentence + `suggestedAction` enum: `switchTarget`, `addId`, `useHandoff`, `changeBreakpoint`.
3. Unit tests per reason code.

**Exit:** `orders.table` shows guidance, not “Text not editable (container)” alone.

### Step 3 — Container guidance

1. On select: if host is non-text-editable container and `textTargets.length > 0`, show banner with CTA.
2. CTA sets `activeTextTargetKey` or selects child id in tree.
3. Optional: auto-select primary text target in simple mode (setting: default off for dev details users).

**Exit:** Recent Orders: user changes title in one click from table wrapper selection.

### Step 4 — Table instrumentation (TailAdmin)

1. Refactor `RecentOrders.tsx` to §4.2 contract (`orders.section`, `orders.title`, `orders.header.*`, row ids).
2. Ensure literal `className` on every patch host (or `cn-basic` where documented).
3. Update `apps/tailadmin-dogfood/README.md` id table.

**Exit:** Index lists ≥ 8 targets under Recent Orders; no duplicate ids.

### Step 5 — Table component mode

1. Detect `hierarchyRole` / index hints → panel mode `table`.
2. Sub-target picker: Section | Column headers | Rows (§4.5).
3. Header dropdown: “Products”, “Category”, “Price”, “Status”.

**Exit:** Simple mode edits “Recent Orders” title and “Products” header without Developer details.

### Step 6 — Row selection

1. Index emits `rowTargets[]` for `orders.row.${key}` pattern.
2. Canvas: clicking a row selects row host (outline + status chip).
3. Panel row list with friendly labels from `product.name` in index metadata.

**Exit:** User selects row 1 and sees Quick edits for that row’s `className`.

### Step 7 — Static table data editing (Tier C)

1. `source-index` detects `tableData.map` binding in same module.
2. `setTableDataField` in ast-engine + protocol op.
3. Overlay: cell text field enabled when target maps to data literal.

**Exit:** Change “MacBook Pro 13” → Validate → Apply updates `tableData[0].name` in source.

### Step 8 — Friendly labels

1. `formatFriendlyId(id)` rules: `metric.orders.label` → “Orders label”; `orders.table` → “Orders table”.
2. Use in selection summary, tree, target lines (replace raw id in simple mode).

### Step 9 — Presets + breakpoint copy

1. Preset definitions in overlay (static map → utility fragment); validate via existing patch path.
2. Device bar: show human label next to Active BP select.

### Step 10 — Tree v2

1. Index: use `parentHostId`, `childTargetIds`, `hierarchyRole` from v0.3 index v3.
2. Panel section **Outline**: grouped by page section; search filter optional.
3. Selecting tree node = same as canvas select.

### Step 11 — Workflow handoff

1. **Copy fix context** button on warn/error banners.
2. Payload schema documented in `nuvioUser.md`.
3. Optional open-in-editor link behind env `NUVIO_EDITOR_URL` or detect Cursor.

### Step 12 — Next.js adapter

1. Package `@nuvio/next` (or documented integration).
2. One dogfood app; index + patch parity with Vite plugin.
3. Update `COMPATIBILITY.md`.

### Step 13 — Layout helpers

1. Button group → existing alpha patch ops for flex/justify/width.
2. Golden test: preset + layout button fragments.

### Step 14 — Release

1. `CHANGELOG.md` `0.4.0-alpha.0` / `0.4.0`.
2. Update `nuvioUser.md`: vibe-coder flow + **Table instrumentation** (§4.2).
3. `DOGFOOD.md` v0.4 checklist (includes table scenarios).
4. Second dogfood pass: new user, no docs, all §9 tasks.

---

## 8. Simple mode vs Developer details

| Surface | Simple mode (default) | Developer details |
| ------- | --------------------- | ----------------- |
| Selected id | Friendly label | `data-nuvio-id` + file:line |
| Patch safety | “Styles OK” / “Pick text target” | Risk + `className` literal type |
| Stack | Status chip only | Vite/React/TW versions |
| Targets | “Editing: Orders label” | Full ids + patch host |
| Errors | One line + action button | Raw `unsupportedReason` code |
| Tree | Friendly names | Ids + file paths |
| Breakpoint | “Applies on: Tablet (md)” | `activeBreakpoint: md` |

**Persistence:** keep existing `localStorage` toggle for Developer details (v0.2+).

---

## 9. Acceptance scenarios (vibe-coder DoD)

New tester, **Developer details off**, TailAdmin (or equivalent) running locally:

| # | Task | Pass criteria |
| - | ---- | ------------- |
| 1 | Change metric value and label color | Done in < 2 min; Validate → Apply → visible on HMR |
| 2 | Select table wrapper; change section title | Table mode → Section → edit “Recent Orders” |
| 3 | Rename column header “Products” → “Items” | Column headers target → Apply updates header cell |
| 4 | Click first table row; change product name | Row target → cell text → `tableData` updated in source |
| 5 | Change table section background / padding | Section host Quick edits |
| 6 | Change metric card background at Desktop (xl) | Quick edits show current color; correct BP |
| 7 | Tablet preview; increase table section padding | Plain breakpoint label |
| 8 | Hide table section; Show again | Hide/Show on `orders.section` |
| 9 | Hit `cn()` or uninstrumented map | Copy fix context or “Make table editable” snippet |
| 10 | (Stable only) Repeat 1–5 on Next dogfood app | Same table UX on Next dev |

---

## 10. Test matrix

### Required before `0.4.0-alpha.0`

| Area | Check |
| ---- | ----- |
| Overlay | Quick edits + collapsed More styles; snapshot or RTL tests for panel sections |
| Overlay | Plain message map: ≥ 15 reasons covered |
| Overlay | Container guidance unit tests (mock index with `textTargets`) |
| TailAdmin Vite | §9 scenarios 1–9 (table scenarios 2–5 mandatory) |
| ast-engine | Golden `v04-*` table data + row id fixtures |
| vite-plugin | Index v4 `rowTargets` / `tableMeta` tests |
| `pnpm dogfood` | Green |

### Required before `0.4.0` stable

| Area | Check |
| ---- | ----- |
| Next dogfood | §9 scenario 10 |
| Tables | Header + row cell + section style on TailAdmin |
| Tree v2 | Select host + child from outline; patch still explicit target |
| Handoff | Copy payload includes file, line, id, reason |
| COMPATIBILITY | Next + Vite rows updated |
| No P0 | Wrong file/node, broken undo, invisible editor |
| Telemetry | Opt-in only; no source in events (if enabled) |

---

## 11. Definition of done

### 11.1 `0.4.0-alpha.0` (Vite vibe-coder slice)

Ship when **Pillars 1–2 + 5 (table section/headers) + 4 (copy)** pass on Vite:

- [x] Quick edits + More styles (Steps 1, 9 partial)
- [x] Plain errors + container guidance (Steps 2–3)
- [x] Table instrumentation + table mode + headers (Steps 4–5)
- [x] Friendly labels (Step 8)
- [x] Copy fix context + table snippet (Step 11)
- [ ] §9 scenarios 1–3, 5–8 without Developer details (manual — [DOGFOOD.md](DOGFOOD.md) § v0.4.0-alpha.0)
- [x] `pnpm dogfood` passes
- [x] `CHANGELOG` + `nuvioUser.md` updated for alpha (include §4.2)

**Row cell editing (Tier C)** shipped in alpha (`setTableDataField` + `orders.row.*.nameText`).

### 11.2 `0.4.0` stable

Everything in alpha, plus:

- [x] Row selection + `setTableDataField` (Steps 6–7)
- [x] Tree v2 (Step 10) — Outline + friendly labels + search (hover optional)
- [x] Next.js adapter + dogfood (Step 12) — `@nuvio/next` + `apps/next-dogfood`
- [x] Layout helpers (Step 13) — Quick edits layout chips
- [x] Style presets shipped (Step 9) — full utility mapping
- [ ] §9 scenarios 4, 10 on Next + full table pass on Vite (manual — [DOGFOOD.md](DOGFOOD.md))
- [ ] Second dogfood pass documented
- [ ] npm publish (optional maintainer step)

---

## 12. Package touchpoints

| Package | v0.4.0 focus |
| ------- | ------------ |
| `packages/overlay` | Quick edits, presets, tree, guidance, handoff UI, plain copy |
| `packages/shared` | Protocol v7: `rowTargets`, `tableMeta`, `setTableDataField` op |
| `packages/vite-plugin` | Index v4; table/row detection; data binding analysis |
| `packages/next` (new) or `packages/vite-plugin` extension | Next dev integration |
| `packages/ast-engine` | `setTableDataField`; presets; `v04-*` fixtures |
| `apps/tailadmin-dogfood` | Full §4.2 Recent Orders contract; chart/nav per §4.7 |
| `apps/next-*-dogfood` (new) | Next acceptance |
| `docs/*` | This doc, nuvioUser, LIMITATIONS, COMPATIBILITY, DOGFOOD |

**Implementation lock:** v0.4 overlay work uses scope `overlay-v0.3` until manifest adds `overlay-v0.4` or user unlocks.

---

## 13. Risk register

| Risk | Mitigation |
| ---- | ---------- |
| Auto-select wrong text child in lists | No auto-promote in `.map()` without explicit id; handoff + docs |
| `setTableDataField` patches wrong array entry | Bind only to named `const` in same file; golden tests; fail-closed |
| Row id template drift | Document `orders.row.${id}` pattern; validate keys match `tableData` |
| Presets write unexpected utilities | Whitelist-only fragments; golden tests |
| Next.js scope explosion | One adapter mode in v0.4.0; second mode in v0.4.x |
| Simple mode hides real blockers | §8 table: never hide errors; always show action |
| Tree desync from canvas | Single `selectId` source of truth |
| UX regression for power users | Developer details retains full v0.3 panel depth |

---

## 14. Explicit deferrals (after v0.4.0)

| Item | Target |
| ---- | ------ |
| Duplicate / create / insert JSX (public) | v0.5+ |
| Design token file sync | v0.5+ |
| Full `cn()` / template literal classNames | v0.5+ (expand flag) |
| Semantic Button/Badge variant editing | v0.5+ |
| In-panel AI chat | not planned (handoff only) |
| Cloud / teams | v0.8+ per implPlan |

---

## 15. Final instruction for implementers

```text
1. Confirm v0.3.0 §10.2 stable DoD is green.
2. Start §7 Step 1 (Quick edits) — calmer panel on every component.
3. Steps 4–7 (tables) are v0.4 differentiators — do not ship 0.4.0 without them on TailAdmin.
4. Instrument §4.2 before building Tier C — ids are the vibe-coder contract.
5. Do not relax fail-closed patching; Tier C only when index proves data binding.
6. Ship 0.4.0-alpha.0 after §11.1; stable after row data + Next + §11.2.
7. Update nuvioUser.md with copy-paste table block (vibe coders won’t read this doc).
```

**Behavior rules (carry forward):**

- Explicit over silent; never patch duplicate or unknown ids.
- Simple mode = tasks; Developer details = engine truth.
- When stuck, **hand off to Cursor** — do not grow an AI editor inside Nuvio.

---

## 16. Relationship to prior docs

| Doc | v0.4.0 alignment |
| --- | ---------------- |
| [`nuvio_v0.3.0.md`](nuvio_v0.3.0.md) §6 | v0.4 preview — **superseded by this doc** for implementation |
| [`nuvio_v0.2.0.md`](nuvio_v0.2.0.md) §74 | AI workflow — **Pillar 4** here |
| [`docs/PRD.md`](PRD.md) | Vibe-coder / AI-native audience |
| [`docs/OVERLAY_PICKER_SYNC.md`](OVERLAY_PICKER_SYNC.md) | Pillar 2.5 picker sync |
| [`docs/TELEMETRY.md`](TELEMETRY.md) | Pillar 4.4 opt-in impl |
| [`docs/implPlan.md`](implPlan.md) | Phase C beyond Vite |

---

## 17. Appendix — example handoff payload (copy fix context)

Plain-text clipboard format (illustrative):

```text
Nuvio could not apply this edit safely.

Component: RecentOrders (orders.table)
File: src/components/ecommerce/RecentOrders.tsx:125
You tried: change text on the table wrapper
Reason: This element is a layout container, not editable text.

Suggested next step: Add data-nuvio-id="orders.title" on the <h3> or select "Recent Orders" in the outline.

Optional prompt for Cursor:
"In RecentOrders.tsx, add data-nuvio-id orders.title to the Recent Orders heading and ensure the title text is a string literal."
```

Implementers may add JSON variant for tooling; clipboard default is plain text for vibe coders.
