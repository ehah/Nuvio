# nuvio

**v1.0.0 — visual editor for React + Vite + Tailwind.** Click UI in the browser, edit text and Tailwind classes, or define a project **Brand Kit** and apply it by category across pages.

Maximum validated coverage for the **Vite + Tailwind** stack: Vite 5/6/8, Tailwind 3/4, `cn()` + conditional classes, shadcn / TailAdmin / DaisyUI paths, click-to-tag, and CLI diagnostics.

Dev-only. Nothing runs in production.

[![npm @nuvio/cli](https://img.shields.io/npm/v/@nuvio/cli?label=%40nuvio%2Fcli)](https://www.npmjs.com/package/@nuvio/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Vite 5–8](https://img.shields.io/badge/Vite-5%20%7C%206%20%7C%208-646cff)](docs/COMPATIBILITY.md)
[![Tailwind 3–4](https://img.shields.io/badge/Tailwind-3.x%20%7C%204.x-38bdf8)](docs/COMPATIBILITY.md)
[![React 18–19](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](docs/COMPATIBILITY.md)

Stop burning AI prompts on padding, colors, and layout tweaks — edit visually, keep real source files.

---

## Demo

### Element editing

**Edit on → click an element → Preview Changes → Apply to Code**

<img src="docs/assets/nuvio-22.gif" width="100%" alt="nuvio demo: Edit on → click an element → Preview Changes → Apply to Code" />

### Brand Kit (project branding)

**Edit on → Brand Kit tab → pick a category → Save Brand → Validate → Apply** on the current page. Navigate to another route and repeat per category — one saved brand in `nuvio/brand.json`, applied across your app.

<img src="docs/assets/nuvio-brand-kit26.gif" width="100%" alt="Brand Kit demo: define heading styles, save brand, validate and apply across dashboard pages" />

Try it on the TailAdmin dogfood app after [Quick Start](#quick-start):

```bash
pnpm build && pnpm dev:tailadmin
```

Open the printed URL → nuvio chip → **Edit on** → **Brand Kit** tab.

Or run the smaller demo app: `pnpm build && pnpm --filter @nuvio/demo-app dev` → `http://localhost:5174`.

Assets: [nuvio-22.gif](docs/assets/nuvio-22.gif) · [nuvio-brand-kit26.gif](docs/assets/nuvio-brand-kit26.gif) · More captures: [docs/screenshots/v0.5/README.md](docs/screenshots/v0.5/README.md)

---

## Quick Start

**You need:** React · Vite · Tailwind · Node 20+

In your project folder (`package.json` + `vite.config`):

```bash
pnpm dlx @nuvio/cli init --yes
pnpm dev
```

Open localhost → **Edit on** → click an element (or **Make Editable** on untagged UI) → **Preview Changes** → **Apply to Code**.

For **Brand Kit**, open the **Brand Kit** tab → choose a category (Card, Heading, Text, Button, …) → adjust presets → **Save Brand** → **Validate** → **Apply** on that page.

That's it. After init, see `nuvio/START_HERE.md` in your project.

**Tip:** When `pnpm create vite` asks “Install and start now?” → **No**, so you can run `init` before the first dev server.

Commands omit version pins — `pnpm dlx @nuvio/cli` always uses npm **latest**.

Full walkthrough: [docs/nuvioUser.md](docs/nuvioUser.md) · Coverage matrix: [docs/COVERAGE.md](docs/COVERAGE.md)

---

## Vite + Tailwind coverage (v1.0)

| Area | 1.0.0 support |
| ---- | ------------- |
| **Vite** | 5.4+, 6.x, 8.x (`create vite` react-ts) |
| **Tailwind** | 3.x and 4.x utility patches |
| **`className`** | literals, `cn()`, conditional `cn`, static `classnames()` |
| **Libraries** | shadcn · TailAdmin · DaisyUI (detection + guides) |
| **Onboarding** | `nuvio init` + click-to-tag (no manual id for first edit) |
| **Brand Kit** | Project brand (`nuvio/brand.json`) · per-category bulk apply · cross-page |
| **CLI** | `doctor` · `scan` · `stats` · `brand scan` · `coverage verify` |

Details: [docs/COVERAGE.md](docs/COVERAGE.md) · [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) · [docs/LIMITATIONS.md](docs/LIMITATIONS.md)

### Example apps

| Example | Run | What it proves |
| ------- | --- | -------------- |
| [vite-basic](examples/vite-basic/) | `pnpm --filter @nuvio/example-vite-basic dev` | init + click-to-tag |
| [shadcn-dashboard](examples/shadcn-dashboard/) | `pnpm --filter @nuvio/example-shadcn-dashboard dev` | shadcn `cn()` + Card/Button |
| [tailadmin-demo](examples/tailadmin-demo/) | `pnpm dev:tailadmin` | Full TailAdmin dashboard + **Brand Kit** dogfood |

See [examples/README.md](examples/README.md).

---

## What nuvio does

After `nuvio init`, nuvio:

1. Installs `@nuvio/vite-plugin` and `@nuvio/overlay`
2. Registers the Vite plugin (dev server only)
3. Mounts the nuvio overlay in your app shell
4. Adds a starter editable region (`page.title` on your first heading)
5. Lets you click elements and edit in the browser — tagged or **Make Editable** (click-to-tag)
6. Generates source-backed patches and writes them to your files
7. **Brand Kit** — save one project brand, then **Validate** and **Apply** by UI category (card, heading, text, button, table, form, badge) on each page

**Preview before apply.** **Undo** after apply. **No production bundle** — the overlay renders nothing when `import.meta.env.DEV` is false.

Click untagged elements to tag them automatically, or add `data-nuvio-id="unique.name"` manually. Brand Kit uses the same ids plus optional [PCC manifests](apps/tailadmin-dogfood/nuvio/pages/) (`nuvio/pages/*.pcc.yaml`) for per-page coverage. See `nuvio/AGENT.md` after init.

---

## Telemetry

nuvio collects **anonymous usage events** to improve onboarding and reliability. Telemetry is **on by default** and **opt-out**.

**Collected**

- CLI / overlay version
- OS and Node version (CLI)
- Event names (e.g. `nuvio_cli_invoked`, `tag_element_completed`, `apply_to_code`)
- Coarse install outcome (success / partial / failed)

**Not collected**

- Source code
- File contents
- File paths
- Project names
- Emails
- Usernames
- Personal information

**Disable anytime**

```bash
NUVIO_TELEMETRY=0
```

In the browser overlay: `localStorage.setItem("nuvio.telemetry", "0")` then refresh.

Details: [docs/PostHog_telemetry.md](docs/PostHog_telemetry.md)

---

## Current Limitations

**Works today**

- React 18 / 19
- Vite 5, 6, and 8
- Tailwind CSS 3.x and 4.x
- Local dev only (`pnpm dev` / `vite dev`)

**Editing constraints**

- Supported `className` modes: string literals, `cn()`, conditional `cn`, static `classnames()` maps — see [LIMITATIONS.md](docs/LIMITATIONS.md)
- Each `data-nuvio-id` must be **unique** in your project (`nuvio scan` lists duplicates)
- Use **Make Editable** for new hosts, or `nuvio/AGENT.md` for dashboard patterns

**CLI diagnostics**

- `nuvio doctor` · `nuvio scan` · `nuvio stats` — see [nuvioUser.md](docs/nuvioUser.md)

**On the roadmap**

- Next.js `nuvio init` (experimental `@nuvio/next` exists in the monorepo today)

**Not planned near-term**

- Vue, Angular, or non-React frameworks
- Production / hosted editing

Honest list: [docs/LIMITATIONS.md](docs/LIMITATIONS.md) · [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)

---

## Advanced Setup

Use this if you skip the CLI or need to wire nuvio by hand.

### Manual install

```bash
pnpm add -D @nuvio/vite-plugin @nuvio/overlay
```

### Register the Vite plugin

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

Optional plugin options:

```ts
nuvio({
  scanGlobs: ["src/**/*.{tsx,jsx}"],
  verbose: process.env.NUVIO_VERBOSE === "1",
});
```

### Mount the dev shell

```tsx
// e.g. App.tsx
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

`NuvioDevShell` returns `null` in production builds. The Vite plugin runs only on `vite dev`. See [docs/DEV_ONLY.md](docs/DEV_ONLY.md).

### Instrument hosts

Put stable **`data-nuvio-id="your.region.id"`** on JSX you want to edit, or use **Make Editable** in the browser. Ids must be unique. Supported `className` shapes include string literals and common `cn()` patterns — see [LIMITATIONS.md](docs/LIMITATIONS.md).

### Troubleshooting

**`0 ids` in the chip** — no TSX/JSX matched under the scan root. Restart dev after changes; try `nuvio({ verbose: true })` and check the terminal for `[nuvio]` logs.

**No nuvio chip after `create vite`** — run `nuvio init` before `pnpm dev`, or restart dev after init.

**Edit button dead / no overlay styles** — re-run `pnpm dlx @nuvio/cli init --yes`, then `rm -rf node_modules/.vite` and `pnpm dev`.

**Apply greyed out** — turn Edit on, select an id’d element, run **Preview Changes** first; fix duplicate ids if reported.

More: [docs/nuvioUser.md](docs/nuvioUser.md) · [CHANGELOG.md](CHANGELOG.md)

### Requirements (monorepo contributors)

- **Node.js** >= 20
- **pnpm** 9 (`corepack enable` recommended)

### Compatibility notes

| Stack | Supported |
| ----- | --------- |
| Vite | 5.4+, 6.x, 8.x |
| React | 18.3+, 19.x |
| Tailwind | 3.x, 4.x |

Overlay CSS is self-contained — you do **not** add `@nuvio/overlay` to Tailwind `content`.

Full matrix: [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)

---

## Maintainer Documentation

For nuvio contributors and release work — not needed to use nuvio in your app.

| Doc | Purpose |
| --- | ------- |
| [docs/nuvioUser.md](docs/nuvioUser.md) | Public user guide |
| [docs/COVERAGE.md](docs/COVERAGE.md) | **Vite + Tailwind maximum coverage** matrix |
| [docs/nuvio_v1.0.md](docs/nuvio_v1.0.md) | **1.0.0** release notes + publish checklist |
| [docs/MIGRATION_0.5_to_1.0.md](docs/MIGRATION_0.5_to_1.0.md) | Upgrade from 0.5.x |
| [examples/README.md](examples/README.md) | Example apps (vite-basic, shadcn, TailAdmin) |
| [docs/DOGFOOD.md](docs/DOGFOOD.md) | Dogfood / acceptance sign-off |
| [docs/FULL_MVP_DOD.md](docs/FULL_MVP_DOD.md) | Definition of done |
| [docs/npmPublish.md](docs/npmPublish.md) | Publish `@nuvio/*` to npm |
| [docs/PostHog_telemetry.md](docs/PostHog_telemetry.md) | Telemetry spec |
| [docs/PRD.md](docs/PRD.md) | Product requirements |
| [docs/implPlan.md](docs/implPlan.md) | Implementation plan |
| [docs/v1.0.md](docs/v1.0.md) | Master roadmap — **one npm ship at v1.0.0** |
| [CHANGELOG.md](CHANGELOG.md) | Published + unreleased changes |

### Monorepo setup

```bash
corepack enable
pnpm install
pnpm build
```

### Demo app (from repo root)

```bash
pnpm --filter @nuvio/demo-app dev
# or
pnpm dev   # builds packages, then starts demo-app
```

Open the printed localhost URL. Turn **Edit on** in the chip to try selection, Preview, Apply, and Undo.

**Quick test:** select a card under **Haider Ali** → **Move down** → **Undo last** if needed.

TailAdmin dogfood: `pnpm dev:tailadmin`

### Scripts

| Script | Description |
| ------ | ----------- |
| `pnpm build` | Build all `packages/*` |
| `pnpm typecheck` | Typecheck packages and apps |
| `pnpm test` | Run package tests |
| `pnpm dogfood` | Build + typecheck + test + demo production build |
| `pnpm v10:acceptance` | v1.0 gate: init + doctor + stats on examples |
| `pnpm test:cli` | CLI test suite |
| `pnpm telemetry:smoke` | Live PostHog CLI smoke (maintainers) |
| `pnpm posthog:verify` | Send a verify event to PostHog |
| `pnpm publish:stable` | Publish five `@nuvio/*` packages to npm `latest` |

---

## Built With AI

nuvio was developed using modern AI-assisted engineering workflows.

Tools used during development include:

- Cursor Agent
- ChatGPT

AI accelerated implementation, while product direction, architecture, and final decisions remained human-led.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

**Repository:** [github.com/ehah/Nuvio](https://github.com/ehah/Nuvio) · **License:** MIT

**GitHub release template:** [.github/release-notes/v1.0.0.md](.github/release-notes/v1.0.0.md) (paste into Releases when publishing)
