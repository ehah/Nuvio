<!-- nuvio-cli-template: 1 -->
# Nuvio agent instructions

This project uses [Nuvio](https://www.npmjs.com/org/nuvio) (dev-only visual editor).

When the user asks to make UI editable or wire Nuvio:

1. Do **not** change unrelated files.
2. Add **string literal** `data-nuvio-id="region.name"` on JSX elements they should click in the browser.
3. Keep `className="..."` as a **string literal** on that same tag when they need Tailwind class patches (avoid `cn(...)` on the patch target).
4. Never use `{condition ? "id" : undefined}` for `data-nuvio-id` — use a string literal on the branch they edit.

**Card pattern:**
- `metric.orders.card` (container)
- `metric.orders.label`
- `metric.orders.value`

**Table pattern:**
- `orders.section`, `orders.title`
- `orders.header.products` (column headers)
- `orders.row.${id}.nameText` (row text — template literal id is OK for rows)

**After instrumentation:** user runs `{{PM_RUN}}`, Edit on, Preview Changes, Apply to Code.

If Vite or shell wiring is missing, see `nuvio/SETUP_TODO.md` or run `pnpm dlx @nuvio/cli@{{NUVIO_VERSION}} init`.

Human quick path: `nuvio/START_HERE.md`.
