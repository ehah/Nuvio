# Simple Mode visibility audit (Step 1)

**Spec:** [nuvio_v0.5.0.md §16 Step 1](./nuvio_v0.5.0.md#step-1-detail--simple-mode-visibility-audit)  
**Date:** 2026-05-31  
**Result:** Pass (with documented exceptions below)

## Method

1. **Static grep** across `packages/overlay/src` for Rule 0 forbidden terms in user-facing surfaces.
2. **Automated tests:** `packages/overlay/src/simple-mode-visibility-audit.test.ts` (onboarding copy, option labels, gating checks).
3. **E2E acceptance:** `scripts/v05-beta-acceptance.mjs` — panel text scan + screenshots SS1–SS10.
4. **Manual review:** TailAdmin dogfood §14 A scenarios B1–B12.

## Grep checklist

| Pattern | Simple Mode exposure | Verdict |
| ------- | -------------------- | ------- |
| Raw ids (`metric.`, `orders.row.`) | Gated behind `developerDetails` in selection strip, tree, pickers | Pass |
| `data-nuvio-id` | Developer Details missing-state only | Pass |
| `className` | Developer Details only | Pass |
| Tailwind utilities (`text-sm`, `p-4`, …) | Developer Details selects; Simple Mode uses `mapSelectOptionsForSimpleMode` + Quick Style chips | Pass |
| Patch ops (`setText`, `mergeTailwind`, …) | Developer Details preview only | Pass |
| `textTarget` / `styleTarget` / `patchHostId` | Developer Details pickers only | Pass |
| `Validate` / `Apply` (old labels) | Developer Details only; Simple Mode uses Preview Changes / Apply to Code | Pass |
| Risk labels / file paths | Developer Details tree + metadata | Pass |

## Simple Mode surfaces verified

| Surface | Rule 0 status | Notes |
| ------- | ------------- | ----- |
| Selection title | Pass | `formatSelectionTitle` — Product Name, Orders Card, … |
| Back navigation | Pass | `simple-mode-nav.ts` — no mode names |
| Task menus | Pass | Label, Value, Card Style; Table Title, … |
| Edit controls | Pass | Text + Quick Style; color/size in Advanced |
| Preview / Apply / Undo | Pass | `simple-mode-actions.tsx` — compact pending states |
| Advanced (single) | Pass | Responsive preview, Outline, Developer Details link |
| Onboarding guides | Pass | No engine terms in `GUIDE_CONTENT` |
| Table guidance | Pass | `table-parts` only at table root menu |
| Blocked states | Pass | Plain reason + Copy Fix Prompt; Open file hidden |
| Bottom chip | Pass | `formatSelectionTitle` in `RuntimeDiagnosticsBlock` |
| Outline (Advanced) | Pass | `friendlyLabels` — no ids/paths |

## Fixes applied during audit

| Issue | Fix |
| ----- | --- |
| `previewApplyMismatch` banner too technical in Simple Mode | Plain “Preview your changes before applying.” |
| `resolvePatchApplyId` leaked `data-nuvio-id` in errors | Plain fallbacks when `!developerDetails` |
| `patchTargetError` could show raw engine strings | Route through `getSimpleSelectErrorMessage` in Simple Mode |

## Documented exceptions (acceptable)

| Location | Why allowed |
| -------- | ----------- |
| Developer Details toggle in header | Explicit opt-in to engine view |
| `ColorPickerRow` popover shade numbers (Advanced) | Inside collapsed Advanced; titles use color names in `simpleMode` |
| Internal variable names in code | Not user-facing |
| Clipboard payload (Copy Fix Prompt) | ids/paths intentionally in clipboard, not panel (Rule 3) |

## Automated regression

```bash
pnpm --filter @nuvio/overlay test simple-mode-visibility-audit
node scripts/v05-beta-acceptance.mjs   # requires pnpm dev:tailadmin
```

## Sign-off

- [x] Static audit complete
- [x] Automated overlay tests green
- [x] E2E script + screenshots (see `docs/screenshots/v0.5/README.md`)
- [x] DOGFOOD §14 A B1–B12 recorded
