# Nuvio

Visual editing layer for React + Vite + Tailwind: localhost overlay, source-backed patches (see `docs/PRD.md` and `docs/implPlan.md`).

`0.3.0-alpha.0` focus: hierarchy-first targeting, deeper Tailwind controls, and breakpoint-aware class patches for real dashboard workflows.

**Repository:** [github.com/ehah/Nuvio](https://github.com/ehah/Nuvio) · **License:** MIT · **Release:** `0.3.0-alpha.0` (Phase B) · **Stable:** [v0.1.0](https://github.com/ehah/Nuvio/releases/tag/v0.1.0) (`latest`)

## Install in your project (~2 minutes)

```bash
pnpm dlx @nuvio/cli init
pnpm dev
```

Then turn **Edit** on in the Nuvio chip and click the starter element (`page.title`). See `nuvio/START_HERE.md` in your project after init.

You need **Node 20+**, a **Vite 5/6 + React** app, and **Tailwind CSS 3.x or 4.x** on the host app.

**v0.2+:** overlay UI is **self-contained** — you do **not** add `@nuvio/overlay` to Tailwind `content`. Full guide: [nuvioUser.md](docs/nuvioUser.md).

### Manual install (without CLI)

```bash
pnpm add -D @nuvio/vite-plugin @nuvio/overlay
```

### 1. Install packages

Use the npm command above (or pin a version, e.g. `@nuvio/vite-plugin@0.1.0`).

### 2. Register the Vite plugin

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nuvio } from "@nuvio/vite-plugin";

export default defineConfig({
  plugins: [react(), nuvio()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
```

Optional: `nuvio({ scanGlobs: ["src/**/*.{tsx,jsx}"], verbose: process.env.NUVIO_VERBOSE === "1" })`.

### 3. Mount the dev shell once

```tsx
// e.g. App.tsx (root layout)
import { NuvioDevShell } from "@nuvio/overlay";

export default function App() {
  return (
    <>
      {/* your app */}
      <NuvioDevShell />
    </>
  );
}
```

`NuvioDevShell` renders **nothing in production** (`import.meta.env.DEV`). The Vite plugin runs **only on `vite dev`**. Install both packages as **devDependencies** — see [DEV_ONLY.md](docs/DEV_ONLY.md).

### 4. Instrument hosts

Put stable **`data-nuvio-id="your.region.id"`** on JSX you want to edit. Ids must be **unique** in the scanned project. Use **string literal** `className="..."` on that same element for Tailwind patches (see [limitations](docs/LIMITATIONS.md)).

Run **`pnpm dev`**, open localhost, turn **Edit on**, select a region, **Validate** then **Apply**. See [compatibility](docs/COMPATIBILITY.md), [limitations](docs/LIMITATIONS.md), and [CHANGELOG](CHANGELOG.md).

**Maintainers:** [npmPublish.md](docs/npmPublish.md), [DOGFOOD.md](docs/DOGFOOD.md), [FULL_MVP_DOD.md](docs/FULL_MVP_DOD.md).

---

## Requirements

- **Node.js** >= 20 (see `package.json` `engines`)
- **pnpm** 9 (`packageManager` field pins a version; use [corepack](https://nodejs.org/api/corepack.html) or install pnpm manually)

## Setup

```bash
corepack enable
pnpm install
pnpm build
```

## Demo app

```bash
pnpm --filter @nuvio/demo-app dev
```

Open the printed localhost URL. Turn **Edit on** in the Nuvio chip:

- **Hover / click** indexed elements (`data-nuvio-id`)
- **Editor** panel: computed styles, source file:line, text + Tailwind edits
- **Validate → Apply → Undo last** (style edits require Validate first)
- **Full MVP:** layout/effect controls (gap, width, opacity, shadow, …), **Move up/down** on flex/grid siblings, **Hide / Show / Duplicate**, **Indexed elements** list
- **Drag / collapse** the Editor panel and Nuvio chip (layout saved in `localStorage`)

**Wire protocol v5** (v0.2 monorepo): index v2 metadata + diagnostics. **v4** on npm `0.1.0`: `moveSibling`, `setHidden`, `duplicateHost`. Rebuild packages (`pnpm build`) after upgrading.

### Full MVP quick test (demo app)

1. Select a card under **Haider Ali**
2. **Move down** — cards swap in the row (auto-applies to `App.tsx`)
3. **Undo last** on the Nuvio chip if needed

**v0.2+:** overlay ships bundled CSS + Shadow DOM — `apps/demo-app` no longer lists `@nuvio/overlay` in Tailwind `content`. **0.1.x on npm:** still requires that `content` line (see [COMPATIBILITY.md](docs/COMPATIBILITY.md)).

### `nuvio()` plugin options (optional)

```ts
// vite.config.ts
nuvio({
  scanGlobs: ["src/**/*.{tsx,jsx}"],
  verbose: process.env.NUVIO_VERBOSE === "1",
});
```

From repo root you can also run:

```bash
pnpm dev
```

(which builds packages, then starts the demo).

### Troubleshooting: `0 ids` in the index

If the Nuvio chip shows **`Index vN 0 ids`**, the source scanner did not find any TSX/JSX under the resolved app root (often a wrong root when cwd differs from the app folder). Restart dev after `pnpm build`; check the terminal for **`[Nuvio] No TSX/JSX files matched`** or enable **`nuvio({ verbose: true })`** to print `index root=… matchedFiles=…`.

### Troubleshooting: TypeScript “Cannot find module 'react'” / JSX errors in `App.tsx`

The editor type-checks against **`node_modules`**. Run **`pnpm install` from the monorepo root** (the folder that contains `pnpm-workspace.yaml`). If install was interrupted or `node_modules` was deleted, you will see missing `react`, missing `@nuvio/overlay`, and cascading JSX errors until dependencies are restored. After install, reload the VS Code / Cursor window if diagnostics stay stale.

This repo uses **`.npmrc`** with **`public-hoist-pattern`** for `react`, `react-dom`, and their `@types` so a copy also appears under the **root** `node_modules`. That helps the TypeScript language service when it resolves modules from the repo root. If you still see **Cannot find module 'react'**, run **`pnpm install`** again from the root after pulling changes.

The demo app’s `tsconfig.json` maps **`@nuvio/overlay`** and **`@nuvio/vite-plugin`** to package **source** so types resolve even before `packages/*/dist` is built; runtime still comes from the workspace packages as usual.

## Scripts

| Script        | Description                                      |
| ------------- | ------------------------------------------------ |
| `pnpm build`  | Build all `packages/*` (tsup → `dist`)           |
| `pnpm typecheck` | Typecheck every package and app               |
| `pnpm test`   | Run Vitest in packages that define tests         |
| `pnpm dogfood` | Build + typecheck + test + demo production build (release gate) |
| `pnpm dev:tailadmin` | Build packages + TailAdmin dogfood app (`apps/tailadmin-dogfood`) |
| `pnpm publish:stable` | Publish `@nuvio/*` to npm **`latest`** (maintainers) |
| `pnpm publish:alpha` | Publish with **`alpha`** dist-tag (maintainers) |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
