# Nuvio examples — Vite + Next.js coverage

Validated example and dogfood projects for **v2.0**. Each README has a short path from clone → **Apply to Code** or **Brand Kit Apply**.

| Example | Path | Port | Proves |
| ------- | ---- | ---- | ------ |
| **vite-basic** | [`vite-basic/`](vite-basic/) | 5175 | `nuvio init` + click-to-tag on plain Vite |
| **shadcn-dashboard** | [`shadcn-dashboard/`](shadcn-dashboard/) | 5176 | shadcn `components/ui/*` + `cn()` class patches |
| **tailadmin-dogfood** | [`../apps/tailadmin-dogfood/`](../apps/tailadmin-dogfood/) | 5173 | Vite TailAdmin + **Brand Kit** + PCC |
| **next-dogfood** | [`../apps/next-dogfood/`](../apps/next-dogfood/) | 3001 | Next.js App Router + **Brand Kit** cross-page |

## Quick start (monorepo)

```bash
pnpm install
pnpm dev:tailadmin          # Vite Brand Kit
pnpm dev:next               # Next.js Brand Kit
pnpm --filter @nuvio/example-vite-basic dev
pnpm --filter @nuvio/example-shadcn-dashboard dev
```

## Verify wiring

```bash
pnpm v10:acceptance
node packages/cli/dist/cli-entry.js doctor --skip-dev-server --cwd examples/vite-basic
node packages/cli/dist/cli-entry.js doctor --skip-dev-server --cwd apps/next-dogfood
```

## Coverage reference

Stack matrix and className modes: [docs/mds/COMPATIBILITY.md](../docs/mds/COMPATIBILITY.md) · Next.js: [docs/mds/NEXT.md](../docs/mds/NEXT.md)
