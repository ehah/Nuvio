# Nuvio — Simple setup guide

**For vibe-coders:** edit your app in the browser while it runs locally. Click text, tweak styles, then save changes back to your code.

You only need this guide and a terminal. Copy the commands exactly.

---

## What you get

1. Run your app like normal (`pnpm dev`).
2. Turn on **Edit** in the little Nuvio bar on the page.
3. Click something on the page you marked as editable.
4. Change text or styles in the side panel.
5. Hit **Validate**, then **Apply** — your source files update.

**Important:** Nuvio only works while developing on your computer. It does not run in production builds.

---

## Before you start (checklist)

Your project should already be:

| You need | What that means |
| -------- | ---------------- |
| **Node 20+** | Run `node -v` in terminal. You should see `v20` or higher. |
| **A Vite + React app** | Usually created with `pnpm create vite ... --template react-ts` |
| **Tailwind CSS v3** | You have `tailwind.config.js` and use classes like `className="text-xl"` |
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

## Step 3 — So the Nuvio UI looks styled (Tailwind)

**File:** `tailwind.config.js` (or `tailwind.config.ts`)

Find the `content:` array. Add this **one extra line** inside it:

```js
"./node_modules/@nuvio/overlay/dist/**/*.js",
```

**Example** — your `content` might look like this when done:

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nuvio/overlay/dist/**/*.js",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**If you skip this:** the Nuvio panel may show up as plain unstyled text.

---

## Step 4 — Show the Nuvio bar on your page

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

## Step 5 — Mark what you want to edit

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

---

## Step 6 — Run and try it

```bash
pnpm dev
```

Open the URL it prints (often `http://localhost:5173`).

### In the browser

1. Find the **Nuvio** chip (small bar on the page).
2. Turn **Edit** **on**.
3. Click an element you gave a `data-nuvio-id`.
4. Change text or styles in the **Editor** panel.
5. Click **Validate** (checks your change).
6. Click **Apply** (writes to your code file).
7. Wrong? Click **Undo last**.

You should see the page update and your file change in the editor (Cursor/VS Code).

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

Then do **Steps 2–6** above.

In `src/index.css`, make sure you have Tailwind’s three lines at the top:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Add at least one `data-nuvio-id` in `src/App.tsx`, run `pnpm dev`, and test **Edit → Validate → Apply**.

---

## Something wrong? (plain fixes)

### Nuvio bar says **0 ids** or nothing is clickable

- You forgot `data-nuvio-id` on your elements, or
- The id is not in a `.tsx` / `.jsx` file under `src/`

Add an id, save, restart `pnpm dev`.

### Nuvio panel looks broken / no colors

You probably missed **Step 3** (the Tailwind `content` line). Add it, save, restart `pnpm dev`.

### **Validate** or **Apply** is greyed out

- Turn **Edit** on first.
- Click an element that has `data-nuvio-id`.
- If it still fails: stop the terminal (`Ctrl+C`), run `pnpm dev` again, hard-refresh the browser (`Cmd+Shift+R` on Mac).

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

2) Follow the simple guide (5 setup steps + how to use Edit/Validate/Apply):
   [paste link to this file in your repo]

3) Packages on npm:
   https://www.npmjs.com/org/nuvio

Works on your machine only — not for production deploys.
```

**Best way to onboard someone:**

1. Share the message above + link to this guide.
2. Ask them to try a **fresh** Vite app first (section “Brand new test project”).
3. Then try one real project.
4. Ask: “Did Validate → Apply work?” and “What broke?”

---

## Quick reference

| I want to… | Do this |
| ---------- | ------- |
| Install | `pnpm add -D @nuvio/vite-plugin @nuvio/overlay` |
| Start app | `pnpm dev` |
| Enable editing | Nuvio chip → **Edit** on |
| Save a change | **Validate** → **Apply** |
| Undo | **Undo last** on the chip |
| Mark editable UI | `data-nuvio-id="something.unique"` on the tag |

---

## More detail (optional)

- Known limits: [LIMITATIONS.md](./LIMITATIONS.md)
- Supported versions: [COMPATIBILITY.md](./COMPATIBILITY.md)
- Dev-only behavior: [DEV_ONLY.md](./DEV_ONLY.md)
