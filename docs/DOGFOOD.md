# Dogfood checklist

Run before tagging a new **`@nuvio/*`** release on npm.

---

## v0.5.0-beta.0 (Cards + Tables — Simple Mode)

Engineering spec: [nuvio_v0.5.0.md](./nuvio_v0.5.0.md) §14 A, §15, §18.1.

### A. Monorepo gate

```bash
pnpm install
pnpm dogfood
pnpm dev:tailadmin
```

Developer Details **off** for all scenarios below.

### B. Beta acceptance (§14 A)

**Signed:** 2026-05-31 — automated E2E (`pnpm v05:acceptance`) + unit audit. Developer Details **off**.

| # | Task | Pass? | Notes |
| - | ---- | ----- | ----- |
| B1 | Change card Label text | Pass | SS2 — Card Label + Quick Style |
| B2 | Change card Value text | Pass | Same flow as B1 (task menu → Value) |
| B3 | Change Card Style | Pass | SS3 — Background / Padding |
| B4 | Change Table Title | Pass | Table menu → Title |
| B5 | Rename table column | Pass | SS6 — Column Header |
| B6 | Edit static row text (Tier C) | Pass | SS5 — direct Product Name click |
| B7 | Preview Changes human-readable | Pass | SS8 — no utilities / op names |
| B8 | Apply to Code | Pass | Preview → Apply (E2E + manual) |
| B9 | Undo | Pass | Overlay undo stack (unit + manual) |
| B10 | Unsupported → Copy Fix Prompt | Pass | Plain reason; audit + unit tests |
| B11 | Screenshot review SS1–SS10 | Pass | [docs/screenshots/v0.5/](./screenshots/v0.5/) |
| B12 | Rule 0 audit | Pass | [SIMPLE_MODE_VISIBILITY_AUDIT.md](./SIMPLE_MODE_VISIBILITY_AUDIT.md) |

---

## v0.5.0 stable (full task router + P-C–P-F)

Engineering spec: [nuvio_v0.5.0.md](./nuvio_v0.5.0.md) §14 B, §15, §18.2.

**Gate:** `pnpm dogfood` green; Developer details **off** unless noted.

| # | Scenario | Pass? | Notes |
| - | -------- | ----- | ----- |
| S1 | Button text + color | | `orders.filter` → Button → Text / Color |
| S2 | Form label edit | | Form Elements page → Label task |
| S3 | Navigation label | | Sidebar → `nav.dashboard` → Navigation items |
| S4 | Chart title/subtitle/card | | `chart.sales.*` or `target.monthly.*` |
| S5 | Section heading + description | | `dashboard.title` or demo-app hero |
| S6 | Breakpoint edit | | Advanced → Responsive preview (Desktop / Mobile) |
| S7 | Hide / Show | | Card Style or Table Style |
| S8 | 10-minute new user | | [nuvioUser.md](./nuvioUser.md) only — no engineering doc |
| S9 | Second external dogfood | | New tester; record friction here |
| S10 | P-C–P-F instrumentation | | §12 gap table all ✅ |
| S11 | Screenshot SS11–SS14 | | Marketing-ready flows |

---

## v0.4.0 stable (Vite + Next)

Engineering spec: [nuvio_v0.4.0.md](./nuvio_v0.4.0.md) §9–11.2.

### A. Monorepo gate

```bash
pnpm install
pnpm dogfood
pnpm --filter @nuvio/tailadmin-dogfood build
pnpm --filter @nuvio/next run build   # after workspace link
pnpm dogfood:next                      # optional Next production build
```

### B. Next dogfood (§9 scenario 10)

```bash
pnpm dev:next
```

Port **3001**, simple mode: repeat TailAdmin tasks 1–5 on `apps/next-dogfood`.

| # | Task | Pass? | Notes |
| - | ---- | ----- | ----- |
| 10 | Metric + table on Next dev | | `@nuvio/next` custom server |

---

## v0.4.0-alpha.0 (Vite vibe-coder)

Engineering spec: [nuvio_v0.4.0.md](./nuvio_v0.4.0.md) §9–11.1.

### A. Monorepo gate

```bash
pnpm install
pnpm dogfood
pnpm --filter @nuvio/tailadmin-dogfood build
```

### B. TailAdmin acceptance (simple mode)

Run `pnpm dev:tailadmin`. Keep **Developer details** off. Complete in under ~15 minutes:

| # | Task | Pass? | Notes |
| - | ---- | ----- | ----- |
| 1 | Metric label + value color (Quick edits) | | `metric.orders.*` |
| 2 | Table wrapper → Table mode → edit “Recent Orders” title | | `orders.title` |
| 3 | Column header “Products” → “Items” | | `orders.header.products` |
| 4 | Row 1 → change product name | | `tableData` in source |
| 5 | Section background / padding | | `orders.section` |
| 6 | Metric card bg at Desktop (xl) | | breakpoint label + apply |
| 7 | Tablet preset → table section padding | | |
| 8 | Hide section → Show again | | `orders.section` |
| 9 | Blocked edit → Copy fix context | | optional `cn()` host |

### C. Engineering record (v0.4 alpha)

| Check | Pass? | Notes |
| ----- | ----- | ----- |
| Quick edits + More styles collapse | | |
| Container guidance + plain errors | | |
| Table mode + §4.2 ids on Recent Orders | | |
| `TableCell`/`TableRow` forward `data-nuvio-id` | | |
| Outline (friendly labels) | | |
| `pnpm dogfood` green | | |
| `nuvioUser.md` table block present | | |

**Stable additions:** `@nuvio/next`, Outline search, handoff action bar, open-in-editor.

---

## v0.3.0-alpha.0 (Phase B)

Engineering spec: [nuvio_v0.3.0.md](./nuvio_v0.3.0.md) §9–12.

### A. Monorepo gate

From repo root:

```bash
pnpm install
pnpm dogfood
pnpm --filter @nuvio/tailadmin-dogfood build
```

### B. TailAdmin acceptance (manual)

Run `pnpm dev:tailadmin`, open dashboard, then verify:

1. Select `metric.orders.card` and edit:
   - `metric.orders.label` text
   - `metric.orders.value` text
2. Apply card/container style changes (background/border/radius) and validate source patch.
3. Switch device preset to Tablet/Mobile and apply padding changes at active breakpoint (`md:*`/`sm:*` context).
4. Validate → Apply → Undo cycle remains stable.

### C. Record results (v0.3 alpha)

| Check | Pass? | Notes |
| ----- | ----- | ----- |
| Hierarchy target picker avoids container dead-end | | |
| Style target routing explicit (host vs child) | | |
| Tailwind depth controls apply safely | | |
| Breakpoint-aware patch modifies only active BP tokens | | |
| `NUVIO=0` disables plugin startup in CI/dev | | |
| `pnpm dogfood` green | | |
| `tailadmin-dogfood` production build green | | |

---

## v0.2.0-alpha.0 (Phase A)

Engineering spec: [nuvio_v0.2.0.md](./nuvio_v0.2.0.md) §18–20.

### A. Monorepo build gate

From repo root:

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm dogfood
```

### B. Fixture smoke (contributors)

Run each app; confirm chip **connected**, overlay **styled** (no DevTools CSS hacks), **Validate → Apply → Undo**.

| Fixture | Command | Minimum checks |
| ------- | ------- | ---------------- |
| **demo-app** (TW v3) | `pnpm dev` | ≥ 7 ids; text + class edit; no `@nuvio/overlay` in `tailwind.config.js` `content` |
| **tailwind-v4-test** | `pnpm --filter @nuvio/tailwind-v4-test dev` | ≥ 14 ids; hero text + card class edit; self-contained overlay |
| **tailadmin-dogfood** | `pnpm dev:tailadmin` | ≥ 10 ids on dashboard; header/card/chart/table select; dark mode; resize + devtools docked |

TailAdmin manual acceptance: [nuvio_v0.2.0.md §13.3](./nuvio_v0.2.0.md).

### C. Clean consumer install (maintainer, pre-publish)

In an empty directory (after **`0.2.0-alpha.0`** is on npm **`alpha`**):

```bash
pnpm create vite nuvio-dogfood --template react-ts
cd nuvio-dogfood
pnpm install
pnpm add -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
pnpm add -D @nuvio/vite-plugin@alpha @nuvio/overlay@alpha
```

Wire per [nuvioUser.md](./nuvioUser.md) (v0.2 — **no** overlay Tailwind `content` line):

- `nuvio()` in `vite.config.ts`
- `<NuvioDevShell />` in `App.tsx`
- At least two elements with `data-nuvio-id` and string-literal `className`

```bash
pnpm dev
```

Confirm **Validate → Apply** and **Undo last**.

### D. Record results (v0.2 alpha)

| Check | Pass? | Notes |
| ----- | ----- | ----- |
| Overlay styled without host TW content | | |
| Chip visible (v3 + v4 + TailAdmin) | | |
| Index ids > 0 | | |
| Diagnostics show versions / risk | | |
| Duplicate id fails at index | | |
| Non-literal className fails clearly | | |
| Validate → Apply (v3) | | |
| Validate → Apply (v4) | | |
| Undo after apply | | |
| TailAdmin text + safe class edit | | |
| Published `@alpha` install | | |

File issues with versions per [COMPATIBILITY.md](./COMPATIBILITY.md).

### Troubleshooting

- **Dev channel `error`**, Validate/Apply disabled: restart `pnpm dev` from repo root, hard-refresh.
- **Clipped / off-screen editor:** use **Reset position** on chip or editor (v0.2+).
- **0 ids:** add `data-nuvio-id` in scanned `.tsx` / `.jsx` under `src/`.

---

## v0.1.0 Full MVP (`latest`)

### Monorepo smoke

```bash
pnpm install
pnpm dogfood
pnpm dev
```

Manual checks on http://localhost:5173:

1. **Edit on** — chip shows dev channel **connected**, index **≥ 7 ids**
2. **Select** — hero, lead, feature cards, pricing CTA each resolve to a source path
3. **Style edit** — change text or a Tailwind control → **Validate** → **Apply** → HMR; **Undo last**
4. **Move** — feature card **Move down/up**; **Undo last**
5. **Hide / Show**, **Duplicate**
6. **Chrome** — drag panels; reload — positions restore

### Clean consumer install (0.1.x)

Requires Tailwind `content` for overlay — see [README](../README.md) §0.1.0.

### Record results

| Check | Pass? | Notes |
| ----- | ----- | ----- |
| Index ids > 0 | | |
| Validate change summary | | |
| Apply writes file | | |
| Undo restores | | |
| Move sibling | | |
| Published `@latest` install | | |
