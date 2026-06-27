# @nuvio/next

Next.js dev adapter for **Nuvio v2.0** — App Router and Pages Router, webpack dev, Brand Kit, click-to-tag.

## What it does

- `withNuvio()` — webpack jsx-loc loader + dev-only wiring in `next.config`
- `createNuvioNextDevServer()` — custom dev server with WebSocket + live source index
- Shared HTTP endpoints: `/__nuvio/brand`, `/__nuvio/pcc` (Brand Kit cross-page)

Works with `@nuvio/overlay/next` (`NuvioNextShell`) mounted in your root layout.

## Quick start

```bash
pnpm dlx @nuvio/cli init --yes
pnpm dev
```

## Manual wiring

1. `pnpm add -D @nuvio/next @nuvio/overlay`
2. Add `withNuvio()` to `next.config.ts`
3. Create `server.js` with `createNuvioNextDevServer()`; point `"dev"` at it
4. Mount `NuvioNextShell` + `import "@nuvio/overlay/style.css"` in root layout

Full guide: [docs/mds/NEXT.md](../../docs/mds/NEXT.md)

## Dogfood app

```bash
pnpm dev:next   # from monorepo root → http://localhost:3001
```

See [apps/next-dogfood](../../apps/next-dogfood/) — routes `/`, `/forms`, `/badges` with PCC manifests.

## Requirements

- Node 20+
- Next.js 14.x or 15.x
- React 18.3+ or 19.x
- Custom dev server (plain `next dev` without Nuvio attach does not connect the overlay)

## Limitations

- Turbopack dev (`--turbo`) may skip click-to-tag until loader support lands
- Patch targets are client-rendered JSX hosts (not Server Component modules directly)

See [docs/mds/LIMITATIONS.md](../../docs/mds/LIMITATIONS.md).
