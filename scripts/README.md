# Nuvio automation scripts

## v0.5 beta acceptance (B1–B12 + SS1–SS10)

```bash
# Terminal 1 — note the port Vite prints (5173 or 5174)
pnpm build && pnpm --filter @nuvio/tailadmin-dogfood dev

# One-time setup
cd scripts && npm install && npx playwright install chromium && cd ..

# Terminal 2 — use the port from Terminal 1
node scripts/v05-beta-acceptance.mjs --url=http://localhost:5174
```

Outputs: `docs/screenshots/v0.5/*.png` and `acceptance-report.json`.
