# Nuvio v0.3.0 — Stack mastery (consolidated release plan)

**Document status:** Final implementation spec for v0.3.0 (start implementation from this doc).  
**Release target:** `0.3.0-alpha.0` first, then `0.3.0` stable after dogfood passes.  
**Prerequisite:** v0.2.0 Phase A complete in-repo (`docs/nuvio_v0.2.0.md`).  
**Companions:** `docs/PRD.md`, `docs/implPlan.md` (Phase 5 + Phase B responsive), `docs/LIMITATIONS.md`, `docs/COMPATIBILITY.md`.

This document **combines** what was previously split across v0.3.0 / v0.3.1 / v0.3.2 into **one release**: real-world editability, Tailwind depth, responsive editing, and post-MVP hardening ship together under **`0.3.0`**.

---

## 0. North star

### Core principle

Nuvio wins by dominating one stack first:

```text
React + Tailwind + Vite + npm/pnpm
```

Do **not** start Next.js, AI workflow products, or design-system platforms until **v0.3.0** exit criteria pass on real dashboards.

### v0.3.0 product promise

> **Nuvio is the practical visual editing layer for production-style React + Tailwind + Vite apps.**

A developer on a typical dashboard (TailAdmin, SaaS template, AI-generated UI) should be able to:

```text
Click a card / heading / metric → edit text and styles (including mobile breakpoints)
  → Validate → Apply → HMR → commit
```

without fighting container dead-ends, missing spacing controls, or hand-editing `md:p-4` in source.

### What “stack mastery” means (honest claim)

| Claim | Meaning |
| ----- | ------- |
| **Works on Vite dev** | Vite 5.4+ / 6.x; plugin + overlay; HMR after apply |
| **Works with Tailwind v3 & v4** | Host TW independent of overlay CSS; patches respect whitelist + merge |
| **Works on real dashboards** | TailAdmin-class apps pass acceptance without console CSS hacks |
| **Editable nested UI** | Cards/metrics: text + styles via child ids or `textTargets` picker |
| **Responsive polish** | Device preview + edit prefixed utilities for active breakpoint |
| **Predictable limits** | Unsupported patterns fail with actionable messages |
| **Safe writes** | No wrong-file / wrong-node writes; duplicate ids blocked at index |

We do **not** claim:

- Every React app without `data-nuvio-id`
- Every `className` pattern (full `cn()`, CSS modules, arbitrary variants)
- Next.js, Remix, or production runtime editing
- Full Figma-like layout freedom

### Explicit deferrals (after v0.3.0)

| Item | Target | Notes |
| ---- | ------ | ----- |
| Next.js (Pages / App Router) | **v0.4.0** | Separate adapter; same `data-nuvio-id` contract where possible |
| Duplicate / create / insert JSX nodes | **v0.4+** | Deferred until stronger hierarchy + id remap + multi-node undo guarantees |
| “Open in Cursor” / copy AI context | **v0.4.x** | Phase C workflow |
| Scoped prompt-assist | **v0.4.x** | Optional; never whole-file rewrite |
| Design token file sync | **v0.5+** | PRD / implPlan Phase 6 |
| Team collaboration / cloud | **v0.8+** | implPlan Phase 8 |

---

## 1. Long-term roadmap (versions)

| Phase | Release | Goal | Key capabilities |
| ----- | ------- | ---- | ---------------- |
| **A — Reliability** | **v0.2.0** ✅ | “This always works.” | Shadow DOM, index v2, diagnostics, TW v4 + TailAdmin |
| **B — Stack mastery** | **v0.3.0** | “Fully useful on React + TW + Vite.” | Nested edit targets, TW depth, responsive + device preview, hardening, golden tests |
| **C — Beyond Vite** | **v0.4.0** | “Works in Next.js dev.” | Next adapter (safe mode), layout helpers, tree v2, workflow hooks |
| **D — Design system** | **v0.5+** | “Consistency across the app.” | Tokens, semantic components, app-wide theme |

```text
v0.2.0  reliability
   ↓
v0.3.0  editability + Tailwind depth + responsive + hardening  ← THIS DOC
   ↓
v0.4.0  Next.js + AI workflow start
```

**Rule:** Do not start **v0.4.0** until **v0.3.0** stable DoD (§12) passes on TailAdmin + `pnpm dogfood`.

---

## 2. Why v0.3.0 exists

v0.2.0 proved **reliability**. Three gaps block the “fully useful” claim:

### Gap 1 — Container vs leaf (editability)

```text
User selects metric.orders.card
  → Text not editable (container)
  → Heading color / values live on children
```

### Gap 2 — Tailwind depth (v0.2 “alpha” controls are not enough)

Users still open Cursor for margin axis, grid columns, line-height, letter-spacing, borders.

### Gap 3 — Responsive (deferred from v0.2)

Dashboards use `sm:` / `md:` / `lg:`. Without breakpoint-aware editing, Nuvio cannot claim TW mastery.

v0.3.0 closes all three while preserving **fail-closed** patching.

---

## 3. v0.3.0 scope matrix

Single release. Nothing in this table is deferred to v0.3.1/0.3.2.

| Capability | v0.3.0 | v0.4+ |
| ---------- | :----: | :---: |
| **Editability** | | |
| `textTargets[]` / child text resolution | ✅ | |
| Editor target picker + plain-language errors | ✅ | |
| Canvas hints for alternate text targets | ✅ | |
| Recommended card instrumentation docs | ✅ | |
| **Tailwind depth** | | |
| Margin per axis, padding, gap (expanded) | ✅ | |
| Flex direction, justify, align, grid cols | ✅ | |
| Line-height, letter-spacing, border, ring (whitelist) | ✅ | |
| Extend whitelist + `read-alpha-picks` + golden tests | ✅ | |
| **Responsive** | | |
| Device preview (desktop / tablet / mobile) | ✅ | |
| Active breakpoint for control reads/writes | ✅ | |
| Edit `sm:`/`md:`/`lg:` tokens only for active BP | ✅ | |
| “Base vs breakpoint” toggle (Developer details) | ✅ | |
| **Hardening** | | |
| Golden fixtures: fragments, conditionals, maps, nested text | ✅ | |
| Optional `cn()` subset behind feature flag | ✅ | |
| Unsupported-pattern taxonomy | ✅ | |
| Debounced validate / batched slider changes | ✅ | |
| `NUVIO=0` / `nuvio({ enabled: false })` | ✅ | |
| Telemetry spec (opt-in; no source by default) | ✅ spec | impl v0.4+ |
| **Defer** | | |
| Next.js adapter | | ✅ |
| Open in Cursor / copy AI context | | ✅ |
| Full `cn()` / template literals | | partial v0.4+ |
| Design token sync | | ✅ v0.5+ |

---

## 4. Release pillars (what ships in v0.3.0)

### v0.3 operating policy (must hold for every step)

Nuvio v0.3.0 is **hierarchy-first, source-indexed, and target-explicit**.

1. User selects a top-level host (`data-nuvio-id` ownership boundary).
2. Overlay exposes explicit internal targets (text target + style target).
3. Every patch applies only to an explicitly resolved AST node.
4. Duplicate ids are never patched.
5. Validate -> Apply -> Undo is required for all writes.

**Scope guard:** v0.3.0 is non-creative/non-generative. It polishes existing indexed UI only (text, style utilities, responsive classes, hide/show, safe move). It does **not** create, insert, or duplicate JSX nodes in public UI.

---

### Pillar A — Real-world editability

**Outcome:** Card/section selection → clear path to edit label, value, and styles.

1. **Index v3 metadata** — per `data-nuvio-id` host:
   - `textTargets[]`: `{ id?, file, line, label, textEditable }`
   - `styleTargets[]`: explicit style patch destinations under the selected host
   - hierarchy hints: `hierarchyRole`, `parentHostId`, `childTargetIds` (where derivable)
   - `patchHostId` when class patches apply to a different node than text
2. **Editor UX**
   - Simple mode: auto primary text target + dropdown (“Orders label”, “5,359 value”)
   - Separate style target dropdown (default: selected host/container)
   - Developer details: full paths, risk, component names
   - Style section always shows **which node** receives `className` patches
3. **Host contract** (document in `nuvioUser.md`):

   ```tsx
   <div data-nuvio-id="metric.orders.card" className="...">
     <h3 data-nuvio-id="metric.orders.label" className="text-gray-500 ...">Orders</h3>
     <p data-nuvio-id="metric.orders.value" className="text-3xl ...">5,359</p>
   </div>
   ```

4. **When only parent is instrumented** — resolver + picker patches **child AST** for text (explicit target, validate → apply); no silent writes.

**Targeting policy (approved):**

| Priority | Approach |
| -------- | -------- |
| 1 | Separate `data-nuvio-id` on label + value (preferred, documented) |
| 2 | Parent id + `textTargets[]` + picker (required for v0.3.0) |
| 3 | Auto promote/generate ids without user confirm | **Out of scope** |

**Behavior rule:** never silently redirect style ops from host to child (or child to host). The UI must show the active style target explicitly.

---

### Pillar B — Tailwind editing depth

**Outcome:** “I rarely need Cursor for spacing/typography tweaks.”

| Area | Controls |
| ---- | -------- |
| Spacing | margin (`m` / `mx` / `my` / `mt`…), padding, gap |
| Layout | flex direction, justify, align, width, max-width, `grid-cols-*` (whitelist) |
| Typography | font size, weight, line-height, letter-spacing, text align |
| Visual | radius, shadow, opacity, border, ring (whitelist) |

**Rules:**

- Extend `@nuvio/ast-engine` whitelist, `read-alpha-picks`, patch ops, and golden tests **together**.
- Unknown utilities → reject at validate with readable message.
- Patches on **literal `className`** on patch host, or **flagged `cn()`** subset (Pillar D).

---

### Pillar C — Responsive & device preview

**Outcome:** “Make this more compact on mobile” without a chat prompt.

**UX:**

1. **Device bar** in editor: Desktop (default) / Tablet / Mobile — sets dev viewport width (or documents host resize guidance).
2. **Active breakpoint** — `sm` | `md` | `lg` | `xl` | `base` derived from preview width.
3. **Controls** read/write utilities for **active breakpoint only** (e.g. at `md`, padding → `md:p-4`).
4. **Developer details:** “Base vs breakpoint” override when expert wants unprefixed `p-4`.

**Implementation notes:**

- Parse existing `className` into breakpoint buckets (`tailwind-merge` + prefix-aware helpers).
- Never strip unrelated breakpoint tokens on apply.
- Fail closed if class string mixes unsupported patterns.

---

### Pillar D — Post-MVP hardening (implPlan Phase 5)

**AST / golden tests**

- Fixtures: fragments, conditional wrappers, `.map()` lists, nested card typography
- CI: golden suite on ast-engine / patch path changes

**Optional `cn()` (feature flag)**

```ts
nuvio({
  classNameMode: "literal-only", // default
  // classNameMode: "cn-basic",  // opt-in: documented patterns only
});
```

**Vite plugin**

- `NUVIO=0` — disable index + WS in CI
- Debounce validate (~300ms) from sliders/color pickers

**Protocol**

- Fields: `textTargets`, `activeTextTargetId`, `patchHostId`, `activeBreakpoint` (if wire needed)
- Bump `PROTOCOL_VERSION` only when incompatible

**Telemetry**

- `docs/TELEMETRY.md`: schema, opt-in, no source by default (spec in v0.3.0; implementation optional)

---

## 5. Non-goals (v0.3.0)

- Next.js / RSC
- Full `cn()` / template literal / CSS modules support
- AI chat UI or auto-apply patches
- Edit history panel / git warnings (v0.3+ nice-to-have)
- Arbitrary descendant `className` patch without id on patch host
- Public create/insert/duplicate element actions
- npm publish as gate for repo sign-off (maintainer ops)

---

## 6. v0.4.0 (deferred — see full spec)

**Canonical plan:** [`docs/nuvio_v0.4.0.md`](nuvio_v0.4.0.md) — vibe-coder UX, Next.js, tree v2, AI handoff, Quick edits.

Summary (do not implement in v0.3.0):

| Track | Deliverable |
| ----- | ----------- |
| Experience | Quick edits, container guidance, tree v2, plain errors |
| Next.js | `@nuvio/next` or plugin mode; **one** mode first (Pages **or** App Router client only) |
| Workflow | Copy fix context for Cursor, optional open in editor |
| Layout | Vibe-labeled flex/grid helpers (source-backed) |

---

## 7. Implementation sequence

**Canonical order.** Complete steps in order; pillars interleave where noted.

| Step | Pillar | Engineering focus | Product outcome |
| ---- | ------ | ----------------- | --------------- |
| **1** | A | Index v3: `textTargets`, `styleTargets`, hierarchy hints | Card select knows host vs leaf targets |
| **2** | A | Protocol + overlay target routing | Edit inner text and style explicit targets safely |
| **3** | A | Plain errors + `nuvioUser` card pattern | Vibe coders understand containers |
| **4** | D | Golden fixtures (fragments, conditional, map, nested) | No silent wrong-node writes |
| **5** | D | `cn()` flag + tests | Safe subset when enabled |
| **6** | B | Whitelist + read picks + panel controls | Margin axis, grid, typography depth |
| **7** | B | Golden tests per utility family | CI guards TW expansions |
| **8** | C | Breakpoint parse/merge in ast-engine | Read `md:p-4` vs `p-4` correctly |
| **9** | C | Device bar + active breakpoint in overlay | Mobile padding edits `md:*` |
| **10** | D | Debounce validate, `NUVIO=0`, telemetry spec | CI-safe, smooth sliders |
| **11** | — | TailAdmin instrumentation + dogfood | Real dashboard proof |
| **12** | — | Docs, changelog, compatibility matrix | Stack mastery claim documented |

**Do not start Step 6 (new controls) before Step 2 exits on TailAdmin.**  
**Do not start Step 8 (responsive) before Step 7 golden tests pass.**

### Step 1 — Index v3 (`textTargets`)

1. Extend `vite-plugin` source index builder.
2. Heuristics: `h1–h6`, `p`, `span`, button text; string-literal JSX text only.
3. Add host-first grouping metadata (`parentHostId`, `childTargetIds`, `hierarchyRole` where safe).
4. Emit on `indexReady` / `selectAck`.
5. Mark `insideMap: caution` — no ambiguous map-index writes.

**Exit:** `metric.orders.card` returns ≥ 2 text targets or clear “instrument children” message.

### Step 2 — Overlay target picker

1. Simple mode: primary text target + dropdown.
2. Add explicit style target dropdown (default host/container).
3. Show “Text applies to …” and “Style applies to …” in panel.
4. Remove public Duplicate button from v0.3.0 UI (keep Hide/Show + safe Move only).
5. Wire `setText` to selected target’s AST node (may differ from click target).
6. Style patches: show `patchHostId` (container vs child with own id).
7. Optional: canvas outline on hover for alternate targets.

**Exit:** Edit “5,359” and label color in one session without Developer details.

### Step 3 — Messaging & docs

1. Map `unsupportedReasons` → plain copy in simple mode.
2. Update `docs/nuvioUser.md`, `docs/LIMITATIONS.md` taxonomy.
3. TailAdmin: add `metric.*.label` / `metric.*.value` ids where missing.

### Step 4 — Golden fixtures

1. `packages/ast-engine/fixtures/v03-*`
2. Top 5 unsupported patterns documented with workarounds.

### Step 5 — `cn()` flag

1. `classNameMode` plugin option; default `literal-only`.
2. Allowlist patterns + one golden test each.

### Step 6–7 — Tailwind depth

1. Whitelist + `read-alpha-picks` + `alpha-patch-ops` for §4 Pillar B table.
2. Editor controls (grouped: Spacing / Layout / Typography / Visual).
3. Golden test per family.

### Step 8–9 — Responsive

1. `parseClassNameByBreakpoint` / `mergeAtBreakpoint` in ast-engine.
2. Overlay: device bar, active BP indicator, controls write prefixed utilities.
3. Fixture: `className="p-4 md:p-6 lg:p-8"` → edit at `md` only changes `md:p-*`.

### Step 10 — Hardening ops

1. Debounce + batch validates from style controls.
2. `NUVIO=0` documented in `DEV_ONLY.md` / `COMPATIBILITY.md`.
3. `docs/TELEMETRY.md` spec.

### Step 11–12 — Dogfood & release docs

1. Run §10 test matrix on demo-app, tailwind-v4-test, tailadmin-dogfood.
2. Changelog `0.3.0-alpha.0` → `0.3.0`.
3. Update README stack mastery paragraph.

---

## 8. Editor UI additions (v0.3.0)

Sections in **Editor** panel (after v0.2 header / selection):

```text
1. Header (Edit, Developer details, Reset, collapse)
2. Selection + host info + target pickers (Pillar A)
3. Status line (simple) / metadata (dev)
4. Device + breakpoint bar (Pillar C)
5. Style — Spacing / Layout / Typography / Visual (Pillar B)
6. Structure (hide/show, safe move only; duplicate/create deferred)
7. Validate → diff → Apply → Undo
8. Indexed list (Developer details)
```

**Simple mode defaults:** hide Structure advanced ops optional (keep Hide/Show if low risk); show device bar in collapsed “Mobile layout” section.
**Developer details mode:** show `file:line`, className kind, map/conditional risk, and explicit patch target ids.

---

## 9. Test matrix

### Required before `0.3.0-alpha.0`

| Fixture | Vite | React | TW | Scenarios |
| ------- | ---: | ----: | -- | --------- |
| `apps/demo-app` | 6.x | 19 | 3.4 | Child ids; target picker; new spacing control; `md:p-*` at tablet preview |
| `apps/tailwind-v4-test` | 6.x | 19 | 4.x | Same; no overlay in TW content |
| `apps/tailadmin-dogfood` | 6.x | 19 | 4.x | Metric label + value text; child text color; responsive padding on card |
| `packages/ast-engine` | — | — | — | Golden: fragment, conditional, map, nested, breakpoint merge |

### Required before `0.3.0` stable

| Check | Expected |
| ----- | -------- |
| Pillar A: ≥ 3 TailAdmin components edited without container dead-end | Pass |
| Pillar B: margin-x + grid-cols + line-height apply on demo + TailAdmin | Pass |
| Pillar C: at `md` preview, padding patch touches only `md:` token | Pass |
| Pillar D: `NUVIO=0` CI build; debounced validate; `cn()` flag if used in fixture | Pass |
| Public editor has no Duplicate/Create/Insert actions in v0.3 | Pass |
| `pnpm dogfood` | Green |
| TailAdmin dogfood ×2 (clean checkout procedure documented) | Pass |
| No P0: wrong file/node, invisible editor, broken undo, unstyled overlay | Pass |

---

## 10. Definition of done

### 10.1 `0.3.0-alpha.0`

**Ship for internal / brave testers when Pillar A + core D pass:**

- [ ] `textTargets` on index / select
- [ ] Target picker in editor (simple + dev)
- [ ] TailAdmin metric label + value editable
- [ ] Explicit text target + style target routing in editor
- [ ] Public Structure UI excludes Duplicate/Create
- [ ] Golden tests: fragment, conditional, map (minimum set)
- [ ] `NUVIO=0` works
- [ ] Validate debouncing on sliders
- [ ] `pnpm dogfood` passes
- [ ] Docs: card instrumentation in `nuvioUser.md`

### 10.2 `0.3.0` stable — stack mastery

**Everything in alpha, plus full v0.3.0 scope:**

- [ ] Pillar B: all controls in §4 Pillar B shipped with golden tests
- [ ] Pillar C: device preview + active breakpoint editing
- [ ] Pillar D: unsupported taxonomy; optional `cn()` flag tested on ≥ 1 real pattern
- [ ] TailAdmin: metrics row polished (text + color + mobile padding) via Nuvio only
- [ ] Form/control with literal `className` edited successfully
- [ ] Compatibility matrix updated for **React + TW v3/v4 + Vite 5.4/6** mastery
- [ ] Duplicate/create/insert remains deferred (no public v0.3 regression)
- [ ] Changelog for `0.3.0`
- [ ] Second dogfood pass documented
- [ ] npm publish (optional maintainer step)

---

## 11. Package touchpoints

| Package | v0.3.0 focus |
| ------- | ------------ |
| `packages/shared` | Protocol v6 (if needed): `textTargets`, `patchHostId`, breakpoint context |
| `packages/vite-plugin` | Index v3; `classNameMode`; `enabled` / `NUVIO=0` |
| `packages/ast-engine` | Nested text ops; breakpoint parse/merge; whitelist; `cn()` subset; golden fixtures |
| `packages/overlay` | Target picker; device/breakpoint bar; expanded controls; message maps |
| `apps/tailadmin-dogfood` | Child ids; responsive classes on cards |
| `apps/demo-app` | Card with children + responsive section for tests |
| `docs/*` | LIMITATIONS, COMPATIBILITY, nuvioUser, TELEMETRY, DOGFOOD v0.3 checklist |

---

## 12. Risk register

| Risk | Mitigation |
| ---- | ---------- |
| Wrong text child in `.map()` | `insideMap: caution`; no auto target in lists without explicit id |
| Breakpoint merge drops `lg:` when editing `md:` | Golden tests; only replace tokens for active prefix |
| Scope creep (Next.js in v0.3) | §6 explicit deferral; gate v0.4 on §10.2 |
| `cn()` explosion | Flag + allowlist only |
| Premature creative edits (duplicate/insert) | Keep non-creative policy in §4; no public create actions in v0.3 |
| Large single release | Ship `0.3.0-alpha.0` after Steps 1–5 + dogfood smoke; stable after full §7 |

---

## 13. Final instruction for implementers

```text
1. Start from §7 Step 1 (index v3 textTargets).
2. Do not add responsive writes until Tailwind depth golden tests exist.
3. Keep fail-closed: no guess on className or text node.
4. Prefer child data-nuvio-id in docs; resolver is for legacy/parent-only ids.
5. Complete 0.3.0-alpha.0 → beta dogfood → 0.3.0 stable per §10.
6. Only then branch v0.4.0 (Next.js) planning.
```

**Behavior rules (from v0.2):**

- Explicit diagnostics over silent partial behavior.
- Never patch duplicate or unknown ids.
- Correctness before control count.

---

## 14. Relationship to prior docs

| Doc | v0.3.0 alignment |
| --- | ---------------- |
| `nuvio_v0.2.0.md` §11.3 | Tailwind superpowers + responsive — **merged into this doc** as Pillars B + C |
| `implPlan.md` Phase 5 | Pillar D |
| `implPlan.md` Phase 6 (responsive) | Pillar C (moved earlier than Next.js) |
| `PRD.md` | Golden tests, opt-in telemetry, host contract |

---

## 15. Handoff from v0.2.0

v0.2.0 delivered overlay reliability, index v2, Developer details toggle, and TailAdmin proof.

**v0.3.0 starts with:** §7 Step 1 — `textTargets` in source index.

**Success sentence for marketing (after stable):**

> Nuvio 0.3.0 lets you visually edit real React + Tailwind + Vite dashboards—including nested card copy, richer styling, and mobile breakpoints—with source-safe validate/apply/undo.
