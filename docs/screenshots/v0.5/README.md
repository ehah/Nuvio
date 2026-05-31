# v0.5.0-beta.0 screenshots (SS1–SS10 + SS6b)

Capture with **Developer Details OFF**, viewport **1440×900**.

## Automated capture

```bash
# Terminal 1 — note the port Vite prints (5173 or 5174)
pnpm build && pnpm --filter @nuvio/tailadmin-dogfood dev

# One-time setup
cd scripts && npm install && npx playwright install chromium && cd ..

# Terminal 2
node scripts/v05-beta-acceptance.mjs --url=http://localhost:5174
```

Outputs PNGs in this folder plus `acceptance-report.json`.

## Checklist (§15 beta gate)

| File | Scenario | Status |
| ---- | -------- | ------ |
| SS1-orders-card-menu.png | Orders Card root menu | ✅ 2026-05-31 |
| SS2-card-label.png | Card Label; `← Orders Card`; Quick Style | ✅ |
| SS3-card-style.png | Card Style; `← Card Options` | ✅ |
| SS4-table-root-menu.png | Recent Orders table menu | ✅ |
| SS5-product-name.png | Product Name; `← Recent Orders Table` | ✅ Rule 6 |
| SS6-column-header.png | Products Header (not generic Column Header) | ✅ Rule 6 |
| SS6b-row-selection.png | Apple Watch Ultra Test Row; no `Row 2 · row` | ✅ Rule 6 |
| SS7-empty-pending.png | No pending changes (compact) | ✅ |
| SS8-preview-state.png | Human-readable preview | ✅ |
| SS9 | Blocked state | Unit tests + audit (no PNG) |
| SS10-advanced-collapsed.png | Single Advanced at bottom | ✅ |

**Rule 6 blockers:** no `NameText`, `← 2 Table`, `Row 2 · row`, or raw id fragments in any shot.

Sign-off: [acceptance-report.json](./acceptance-report.json) — all E2E checks pass (Rule 0 + Rule 6).  
Manual record: [DOGFOOD.md](../../DOGFOOD.md) § v0.5.0-beta.0.
