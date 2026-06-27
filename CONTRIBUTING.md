# Contributing

## Releases (npm)

**Stable line:** `@nuvio/*` **1.1.0** on npm **`latest`** (Vite + Brand Kit). **v2.0** adds **Next.js** via `@nuvio/next` (monorepo-validated; npm alignment at **2.0.0** when published).

Before publishing: `pnpm dogfood` (Vite) and `pnpm dogfood:next` (Next). Maintainer flow: [docs/npmPublish.md](./docs/npmPublish.md). Stack matrix: [docs/mds/COMPATIBILITY.md](./docs/mds/COMPATIBILITY.md). Limits: [docs/mds/LIMITATIONS.md](./docs/mds/LIMITATIONS.md). [CHANGELOG.md](./CHANGELOG.md) tracks releases.

## Monorepo layout

- `packages/shared` — wire protocol (Zod), shared types, path safety helpers
- `packages/vite-plugin` — Vite dev integration (WebSocket, source index, patch apply)
- `packages/next` — Next.js adapter (`withNuvio`, custom dev server, jsx-loc webpack loader)
- `packages/overlay` — dev overlay UI (React); `@nuvio/overlay/next` for Next.js
- `packages/ast-engine` — AST patch engine (text + whitelist Tailwind merge, Prettier)
- `packages/cli` — `init`, `doctor`, `scan`, `stats`, brand, coverage (Vite + Next + monorepo)
- `apps/demo-app` — minimal Vite element-editing demo (port 5174)
- `apps/tailadmin-dogfood` — Vite TailAdmin Brand Kit dogfood (port 5173)
- `apps/next-dogfood` — Next.js App Router Brand Kit dogfood (port 3001)

## Dev loop

1. `pnpm install` — from the **repo root** (see root `.npmrc` for React hoisting so editors resolve `react` reliably).
2. `pnpm build` — required after changing `packages/*` before running dogfood apps.
3. Pick a fixture:
   - `pnpm dev:tailadmin` — Vite + Brand Kit
   - `pnpm dev:next` — Next.js + Brand Kit
   - `pnpm --filter @nuvio/demo-app dev` — minimal Vite element editing

## Tests and types

```bash
pnpm typecheck
pnpm test
```

File writes from the plugin go through `@nuvio/ast-engine` and `assertPathWithinRoot` from `@nuvio/shared/secure-path` (Node-only; not included in the browser-safe `@nuvio/shared` entry).

## Dev-time source index (Phase 1)

See [packages/vite-plugin/SOURCE_INDEX.md](./packages/vite-plugin/SOURCE_INDEX.md) for where the AST id index lives and default scan roots. Next reuses the same dev-session surface via `@nuvio/next`.
