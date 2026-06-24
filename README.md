# nuvio

**v2.0** — visual editor for **React + Vite + Tailwind + Next.js** (dev-only; nothing runs in production).

Define a project **Brand Kit** and apply it by category across pages, or click individual elements to edit text and Tailwind classes — preview first, then apply to real source files.

[![npm @nuvio/cli](https://img.shields.io/npm/v/@nuvio/cli?label=%40nuvio%2Fcli%201.1.0)](https://www.npmjs.com/package/@nuvio/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Vite 5–8](https://img.shields.io/badge/Vite-5%20%7C%206%20%7C%208-646cff)](#vite--tailwind-coverage)
[![Tailwind 3–4](https://img.shields.io/badge/Tailwind-3.x%20%7C%204.x-38bdf8)](#vite--tailwind-coverage)
[![React 18–19](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](#vite--tailwind-coverage)

**Published packages (2.0.0-alpha):** `@nuvio/cli` · `@nuvio/vite-plugin` · `@nuvio/next` · `@nuvio/overlay` · `@nuvio/shared` · `@nuvio/ast-engine`

Stop burning AI prompts on padding, colors, and layout tweaks — edit visually, keep real source files.

---

## Demo

### Brand Kit (project branding)

**Edit on → Brand Kit tab → pick a category → Save Brand → Validate → Apply** on the current page. Navigate to another route and repeat per category — one saved brand in `nuvio/brand.json`, applied across your app.

Categories: **card**, **heading**, **text**, **button**, **table**, **form**, **badge**.

<img src="docs/assets/nuvio-brand-kit26.gif" width="100%" alt="Brand Kit demo: define styles, save brand, validate and apply across dashboard pages" />

### Element editing

**Edit on → click an element → Validate Changes → Apply to Code**

<img src="docs/assets/nuvio-element16.gif" width="100%" alt="nuvio demo: Edit on → click an element → Preview Changes → Apply to Code" />

**Try Next.js dogfood:**

```bash
pnpm install
pnpm dev:next
```

Open `http://localhost:3001` → nuvio chip → **Edit on**. See [docs/mds/NEXT.md](docs/mds/NEXT.md).

**Try Brand Kit (Vite, recommended):**

```bash
pnpm install
pnpm build && pnpm dev:tailadmin
```

Open the printed URL (default `http://localhost:5173/`) → nuvio chip → **Edit on** → **Brand Kit** tab. See [apps/tailadmin-dogfood/README.md](apps/tailadmin-dogfood/README.md) for per-page category counts and PCC hosts.

**Try element editing only:**

```bash
pnpm build && pnpm --filter @nuvio/demo-app dev
```

Open `http://localhost:5174` → **Edit on** → **Edit Element** tab.

Demo assets: [nuvio-brand-kit26.gif](docs/assets/nuvio-brand-kit26.gif) · [nuvio-element16.gif](docs/assets/nuvio-element16.gif)

---

## Quick Start

**You need:** React · Vite · Tailwind · Node 20+

In your project folder (`package.json` + `vite.config` or `next.config`):

**Vite:**

```bash
pnpm dlx @nuvio/cli init --yes
pnpm dev
```

**Next.js:**

```bash
pnpm dlx @nuvio/cli init --yes
pnpm dev
```

(`init` detects the framework and wires `withNuvio()` + custom `server.js` for Next.)

Open localhost → **Edit on**.

| Goal | Flow |
| ---- | ---- |
| **Brand a page** | **Brand Kit** tab → category chip → adjust presets → **Save Brand** → **Validate** → **Apply** |
| **Edit one element** | **Edit Element** tab → click a host → **Preview Changes** → **Apply to Code** |

After init, see `nuvio/START_HERE.md` and `nuvio/AGENT.md` in your project.

**Tip:** When `pnpm create vite` asks “Install and start now?” → **No**, so you can run `init` before the first dev server.

Commands omit version pins — `pnpm dlx @nuvio/cli` uses npm **latest** (currently **1.1.0**).

More: [CHANGELOG.md](CHANGELOG.md) · [Next.js guide](docs/mds/NEXT.md) · [Monorepo](docs/mds/MONOREPO.md) · [examples/README.md](examples/README.md) · [TailAdmin dogfood](apps/tailadmin-dogfood/README.md)

---

## Vite + Tailwind + Next.js coverage

| Area | v2.0 support |
| ---- | ------------- |
| **Vite** | 5.4+, 6.x, 8.x (`create vite` react-ts) |
| **Next.js** | 14.x, 15.x App Router + Pages Router (webpack dev) |
| **React** | 18.3+, 19.x |
| **Tailwind** | 3.x and 4.x utility patches |
| **`className`** | literals, `cn()`, conditional `cn`, static `classnames()` |
| **Libraries** | shadcn · TailAdmin · DaisyUI (detection + guides in CLI templates) |
| **Onboarding** | `nuvio init` + click-to-tag (no manual id for first edit) |
| **Brand Kit** | `nuvio/brand.json` · per-category bulk validate/apply · cross-page |
| **PCC (optional)** | `nuvio/pages/*.pcc.yaml` page coverage manifests · `nuvio coverage verify` |
| **CLI** | `doctor` · `scan` · `stats` · `brand scan` · `brand apply` · `coverage verify` |

### Example apps

| Example | Run | What it proves |
| ------- | --- | -------------- |
| [vite-basic](examples/vite-basic/) | `pnpm --filter @nuvio/example-vite-basic dev` | init + click-to-tag |
| [shadcn-dashboard](examples/shadcn-dashboard/) | `pnpm --filter @nuvio/example-shadcn-dashboard dev` | shadcn `cn()` + Card/Button |
| [tailadmin-dogfood](apps/tailadmin-dogfood/) | `pnpm dev:tailadmin` | Full TailAdmin + **Brand Kit** + PCC dogfood |
| [next-dogfood](apps/next-dogfood/) | `pnpm dev:next` | Next App Router + Brand Kit dogfood |

See [examples/README.md](examples/README.md).

---

## What nuvio does

After `nuvio init`, nuvio:

1. Installs `@nuvio/vite-plugin` and `@nuvio/overlay`
2. Registers the Vite plugin (dev server only)
3. Mounts the nuvio overlay in your app shell
4. Adds a starter editable region (`page.title` on your first heading)
5. Opens the **Brand Kit** tab by default — category chips, presets, **Save Brand**, **Validate**, **Apply**
6. Lets you click elements and edit in the browser — tagged or **Make Editable** (click-to-tag)
7. Generates source-backed patches and writes them to your files

**Preview before apply.** **Undo** after apply. **No production bundle** — the overlay renders nothing when `import.meta.env.DEV` is false.

Instrument hosts with **`data-nuvio-id="unique.name"`** on patchable DOM nodes (literal `className` on the same element for Brand Kit bulk apply). Optional [PCC manifests](apps/tailadmin-dogfood/nuvio/pages/) declare which hosts belong to each brand category per route.

---

## Brand Kit (summary)

| Section | Purpose |
| ------- | ------- |
| **Category** | Card, Heading, Text, Button, Table, Form, Badge — counts for the current page |
| **Define Brand** | Presets for the active category + **Save Brand** → `nuvio/brand.json` |
| **Apply Brand** | **Validate** (dry-run all hosts in category) → **Apply** (write patches) |

**Cross-page:** save once, then on each route choose a category → **Validate** → **Apply**. Validate is enabled only after **Save Brand**; Apply only after a successful Validate for that category on that page.

Dogfood reference: [apps/tailadmin-dogfood/README.md](apps/tailadmin-dogfood/README.md)

---

## Telemetry

nuvio collects **anonymous usage events** to improve onboarding and reliability. Telemetry is **on by default** and **opt-out**.

**Collected:** CLI / overlay version · OS and Node (CLI) · event names (e.g. `nuvio_cli_invoked`, `apply_to_code`, brand-kit events) · coarse install outcome

**Not collected:** source code · file contents · file paths · project names · emails · personal information

**Disable anytime:**

```bash
NUVIO_TELEMETRY=0
```

In the browser overlay: `localStorage.setItem("nuvio.telemetry", "0")` then refresh.

Details: [CHANGELOG.md](CHANGELOG.md) (telemetry entries under 0.5.4+)

---

## Current limitations

**Works today**

- React 18 / 19 · Vite 5, 6, 8 · Tailwind 3.x / 4.x
- Local dev only (`pnpm dev` / `vite dev`)
- Element editing + Brand Kit bulk apply for patchable hosts

**Editing constraints**

- Supported `className` modes: string literals, `cn()`, conditional `cn`, static `classnames()` maps
- Each `data-nuvio-id` must be **unique** (`nuvio scan` lists duplicates)
- Brand Kit bulk apply requires **literal** `data-nuvio-id` + patchable `className` on native DOM (wrapper props alone are not indexed)
- Use **Make Editable** for new hosts, or follow [TailAdmin dogfood](apps/tailadmin-dogfood/README.md) instrumentation patterns

**CLI diagnostics**

- `nuvio doctor` · `nuvio scan` · `nuvio stats` · `nuvio brand scan` · `nuvio coverage verify`

**On the roadmap**

- Next.js `nuvio init` (experimental `@nuvio/next` in monorepo)
- Apply brand to all pages in one action (Approach 2)

**Not planned near-term**

- Vue, Angular, or non-React frameworks
- Production / hosted editing

---

## Advanced setup

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

`NuvioDevShell` returns `null` in production builds. The Vite plugin runs only on `vite dev`.

### Instrument hosts

Put stable **`data-nuvio-id="your.region.id"`** on JSX you want to edit or brand. For Brand Kit bulk apply, use a **literal** `className` on the same native element (see dogfood form sections).

Optional: add `nuvio/pages/<page>.pcc.yaml` and run `nuvio coverage verify --page <page>`.

### Troubleshooting

| Symptom | Fix |
| ------- | --- |
| **`0 ids` in chip** | Restart dev after TSX changes; try `nuvio({ verbose: true })` |
| **No chip after `create vite`** | Run `nuvio init` before `pnpm dev`, or restart dev |
| **Edit button dead** | Re-run `pnpm dlx @nuvio/cli init --yes`; `rm -rf node_modules/.vite`; restart dev |
| **Apply greyed out (Edit tab)** | Select an id’d element; run **Preview Changes** first |
| **Validate greyed out (Brand Kit)** | **Save Brand** first; pick a category with hosts on the page |
| **Apply greyed out (Brand Kit)** | Run **Validate** for the active category first |
| **Category count too low** | Add literal `data-nuvio-id` on native elements; declare hosts in PCC — see [dogfood README](apps/tailadmin-dogfood/README.md) |

More: [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

### Requirements (monorepo contributors)

- **Node.js** >= 20
- **pnpm** 9 (`corepack enable` recommended)

### Compatibility

| Stack | Supported |
| ----- | --------- |
| Vite | 5.4+, 6.x, 8.x |
| React | 18.3+, 19.x |
| Tailwind | 3.x, 4.x |

Overlay CSS is self-contained — you do **not** add `@nuvio/overlay` to Tailwind `content`.

---

## Maintainer documentation

For contributors — not required to use nuvio in your app.

| Resource | Purpose |
| -------- | ------- |
| [CHANGELOG.md](CHANGELOG.md) | Releases and notable changes |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Monorepo layout and dev loop |
| [examples/README.md](examples/README.md) | Example apps + `v10:acceptance` |
| [apps/tailadmin-dogfood/README.md](apps/tailadmin-dogfood/README.md) | Brand Kit dogfood, PCC, instrumented ids |

### Monorepo setup

```bash
corepack enable
pnpm install
pnpm build
```

### Demo apps

```bash
pnpm dev:tailadmin          # Brand Kit + TailAdmin (port 5173)
pnpm --filter @nuvio/demo-app dev   # Element editing demo (port 5174)
pnpm dev                    # build packages, then demo-app
```

### Scripts

| Script | Description |
| ------ | ----------- |
| `pnpm build` | Build all `packages/*` |
| `pnpm typecheck` | Typecheck packages and apps |
| `pnpm test` | Run package tests |
| `pnpm dogfood` | Build + typecheck + test + demo production build |
| `pnpm dev:tailadmin` | TailAdmin dogfood dev server |
| `pnpm coverage:dogfood` | PCC verify all tailadmin pages |
| `pnpm brand:dogfood` | Brand scan all tailadmin pages |
| `pnpm brand:apply:dogfood` | CLI brand apply (dogfood) |
| `pnpm v10:acceptance` | v1.0 gate: init + doctor + stats on examples |
| `pnpm test:cli` | CLI test suite |
| `pnpm telemetry:smoke` | PostHog CLI smoke (maintainers) |
| `pnpm publish:stable` | Publish five `@nuvio/*` packages to npm `latest` |

---

## Built with AI

nuvio was developed using modern AI-assisted engineering workflows (Cursor Agent, ChatGPT). AI accelerated implementation; product direction, architecture, and final decisions remained human-led.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

**Repository:** [github.com/ehah/Nuvio](https://github.com/ehah/Nuvio) · **License:** MIT

**Release notes template:** [.github/release-notes/v1.0.0.md](.github/release-notes/v1.0.0.md)
