# Nuvio — Simple setup guide

**For vibe-coders:** edit your app in the browser while it runs locally. Click text, tweak styles, then save changes back to your code.

You only need this guide and a terminal. Copy the commands exactly.

**v0.2+:** Nuvio ships its own overlay styles. You do **not** add `@nuvio/overlay` to Tailwind `content`.

---

## What you get

1. Run your app like normal (`pnpm dev`).
2. Turn on **Edit** in the little Nuvio bar on the page.
3. Click something on the page you marked as editable.
4. Change text or styles in the side panel — pick a **task** (Label, Card Style, Table Title, etc.) when prompted.
5. Use **Quick Style** chips (Normal, Muted, Strong, Larger) for text — no need to know Tailwind.
6. Hit **Preview Changes**, then **Apply to Code** — your source files update.

**Simple Mode layout (v0.5):** each screen shows what you're editing, what you can change, and how to apply it. Device preview and more styles live under **Advanced** at the bottom. Turn on **Developer details** in the panel header only when you need file paths or technical diagnostics.

**Important:** Nuvio only works while developing on your computer. It does not run in production builds.

---

## Before you start (checklist)

Your project should already be:

| You need | What that means |
| -------- | ---------------- |
| **Node 20+** | Run `node -v` in terminal. You should see `v20` or higher. |
| **A Vite + React app** | Usually created with `pnpm create vite ... --template react-ts` |
| **Tailwind CSS v3 or v4** | v3: `tailwind.config.js` and `@tailwind` in CSS. v4: often `@import "tailwindcss"` in CSS (no config file required). |
| **pnpm** | You install packages with `pnpm` (not only `npm`) |

If you are starting from zero, use **“Brand new test project”** at the bottom of this guide first.

---

## Step 1 — Install Nuvio (one command)

Open terminal in your **project folder** (the folder that has `package.json`).

```bash
pnpm add -D @nuvio/vite-plugin @nuvio/overlay
```

Wait until it finishes. You do not need to install anything else from npm for basic use.

---

## Step 2 — Tell Vite to use Nuvio

**File:** `vite.config.ts` (in your project root)

Replace the whole file with this, **or** add the `nuvio` parts to your existing file:

```ts
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

**What changed:** you added `import { nuvio }` and `nuvio()` next to `react()` in `plugins`.

---

## Step 3 — Show the Nuvio bar on your page

**File:** usually `src/App.tsx`

At the **top**, add:

```tsx
import { NuvioDevShell } from "@nuvio/overlay";
```

Inside your component’s `return`, add `<NuvioDevShell />` once (anywhere inside is fine, often at the bottom):

```tsx
export default function App() {
  return (
    <>
      {/* your existing page content */}
      <NuvioDevShell />
    </>
  );
}
```

---

## Step 4 — Mark what you want to edit

On any element you want to click and edit, add **`data-nuvio-id`** with a short unique name.

**Example:**

```tsx
<h1
  data-nuvio-id="home.title"
  className="text-4xl font-bold"
>
  Welcome
</h1>
```

**Rules (keep it simple):**

- Use a **unique** name per element (like `home.title`, `nav.logo`, `card.1`).
- Do **not** use random IDs that change every refresh.
- Keep `className="..."` as normal text in quotes on that same tag if you want to edit Tailwind classes.

### Card pattern (recommended for v0.3+)

Use one host id for the card and explicit child ids for label/value text:

```tsx
<div data-nuvio-id="metric.orders.card" className="rounded-xl p-4">
  <p data-nuvio-id="metric.orders.label">Orders</p>
  <h3 data-nuvio-id="metric.orders.value">5,359</h3>
</div>
```

Why this matters:

- You can select the card host first, then choose **Text target** (`label` or `value`).
- You can keep **Style target** on the card container for spacing/background edits.
- Duplicate ids block writes. Every repeated card needs unique ids (`.copy`, `.copy2`, ...).

### Table block (v0.4 — dashboards)

Instrument the **whole** Recent Orders–style block, not only the scroll wrapper. Use **string literals** for section title and column headers. Forward `data-nuvio-id` on custom `TableCell` / `TableRow` components (spread props onto `<th>` / `<tr>`).

```tsx
const tableData = [
  { id: 1, name: "MacBook Pro 13”", category: "Laptop", price: "$2399.00" },
  // ...
];

export function RecentOrders() {
  return (
    <div data-nuvio-id="orders.section" className="rounded-2xl border ...">
      <h3 data-nuvio-id="orders.title" className="...">
        Recent Orders
      </h3>
      <div data-nuvio-id="orders.table" className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow data-nuvio-id="orders.header.row">
              <TableCell isHeader data-nuvio-id="orders.header.products" className="...">
                Products
              </TableCell>
              {/* orders.header.category, .price, .status */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((product) => (
              <TableRow
                key={product.id}
                data-nuvio-id={`orders.row.${product.id}`}
                className="..."
              >
                <TableCell className="...">
                  <p data-nuvio-id={`orders.row.${product.id}.nameText`} className="...">
                    {product.name}
                  </p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

**In the editor (simple mode, no Developer details):**

1. Click the table area → **Table mode** → pick **Section**, **Column headers**, or **Rows**.
2. Edit title/header text in **Quick edits**.
3. For row product names, select a row then edit text (updates `tableData` in source when indexed).
4. Stuck? Use **Copy fix context** on the error banner.

---

## Step 5 — Run and try it

```bash
pnpm dev
```

Open the URL it prints (often `http://localhost:5173`).

### In the browser

1. Find the **Nuvio** chip (small bar on the page).
2. Turn **Edit** **on**.
3. Click an element you gave a `data-nuvio-id`.
4. Change text or styles in the **Editor** panel.
5. Click **Preview Changes** (checks your change).
6. Click **Apply to Code** (writes to your code file).
7. Wrong? Click **Undo last**.

You should see the page update and your file change in the editor (Cursor/VS Code).

The chip shows **diagnostics** (Vite channel, indexed id count, file/line, className patchability, risk level) when something is wrong — read those messages before guessing.

---

## Tailwind v4 apps

If your app uses **Tailwind CSS v4** (CSS-first, `@import "tailwindcss"`):

- You still follow **Steps 1–5** above.
- You do **not** add `./node_modules/@nuvio/overlay/dist/**/*.js` to Tailwind `content`.
- Nuvio overlay UI is **self-contained** (Shadow DOM + bundled CSS).

---

## Brand new test project (no existing app?)

Run these in terminal, **one block at a time**:

```bash
cd ~
pnpm create vite my-nuvio-app --template react-ts
cd my-nuvio-app
pnpm install
pnpm add -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
pnpm add -D @nuvio/vite-plugin @nuvio/overlay
```

Then do **Steps 2–5** above.

In `src/index.css`, make sure you have Tailwind’s three lines at the top:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Add at least one `data-nuvio-id` in `src/App.tsx`, run `pnpm dev`, and test **Edit → Preview Changes → Apply to Code**.

---

## Something wrong? (plain fixes)

### Nuvio bar says **0 ids** or nothing is clickable

- You forgot `data-nuvio-id` on your elements, or
- The id is not in a `.tsx` / `.jsx` file under `src/`

Add an id, save, restart `pnpm dev`. The diagnostics line will say **0 ids indexed**.

### Nuvio panel looks broken / clipped / off-screen

On **v0.2+** this is usually **not** a missing Tailwind `content` line. Try:

- **Reset position** on the chip or editor header.
- Hard-refresh the browser (`Cmd+Shift+R` on Mac).
- Restart `pnpm dev`.

If you are on **Nuvio 0.1.x**, add the overlay path to Tailwind `content` (see [COMPATIBILITY.md](./COMPATIBILITY.md)).

### **Preview Changes** or **Apply to Code** is greyed out

- Turn **Edit** on first.
- Click an element that has `data-nuvio-id`.
- If class edits fail: `className` must be a **string literal** on that tag (not `cn(...)`).
- If the chip warns about duplicates, rename duplicate ids first (for example `metric.orders.value.copy`).
- If it still fails: stop the terminal (`Ctrl+C`), run `pnpm dev` again, hard-refresh the browser.

### Install command failed

- Run `node -v` — need v20+.
- Run commands from the folder that contains `package.json`.

---

## Share Nuvio with friends (copy/paste message)

Send them this — no tech lecture needed:

```text
Try Nuvio — edit your React app in the browser while it runs locally.

1) In your Vite + React + Tailwind project:
   pnpm add -D @nuvio/vite-plugin @nuvio/overlay

2) Follow the simple guide (setup + Edit / Preview / Apply to Code):
   [paste link to this file in your repo]

3) Packages on npm:
   https://www.npmjs.com/org/nuvio

Works on your machine only — not for production deploys.
No Tailwind content hack for the overlay on v0.2+.
```

**Best way to onboard someone:**

1. Share the message above + link to this guide.
2. Ask them to try a **fresh** Vite app first (section “Brand new test project”).
3. Then try one real project.
4. Ask: “Did Preview Changes → Apply to Code work?” and “What broke?”

---

## Quick reference

| I want to… | Do this |
| ---------- | ------- |
| Install | `pnpm add -D @nuvio/vite-plugin @nuvio/overlay` |
| Start app | `pnpm dev` |
| Enable editing | Nuvio chip → **Edit** on |
| Save a change | **Preview Changes** → **Apply to Code** |
| Style text quickly | **Quick Style** chips on Label / Value / table text screens |
| Go back in a task | **← Orders Card** / **← Recent Orders Table** under the title |
| Undo | **Undo last** on the chip |
| Mark editable UI | `data-nuvio-id="something.unique"` on the tag |
| Edit a dashboard table | Use §4.2 ids + Table mode in the panel |
| Fix clipped UI | **Reset position** on chip/editor |
| Copy context for Cursor | **Copy Fix Prompt** when apply is blocked |

---

## More detail (optional)

- Known limits: [LIMITATIONS.md](./LIMITATIONS.md)
- Supported versions: [COMPATIBILITY.md](./COMPATIBILITY.md)
- Maintainer dogfood (v0.2 fixtures): [DOGFOOD.md](./DOGFOOD.md)
- Dev-only behavior: [DEV_ONLY.md](./DEV_ONLY.md)
- v0.2.0 engineering spec: [nuvio_v0.2.0.md](./nuvio_v0.2.0.md)
- v0.4 vibe-coder spec (maintainers): [nuvio_v0.4.0.md](./nuvio_v0.4.0.md)
