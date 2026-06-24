# Next.js dogfood (`apps/next-dogfood`)

Dev fixture for **Nuvio v2 Next.js** — App Router, custom `server.js`, Brand Kit, and PCC manifests.

## Run

```bash
pnpm dev:next
```

Open [http://localhost:3001](http://localhost:3001).

## Pages

| Route | PCC page | Brand Kit categories |
| ----- | -------- | -------------------- |
| `/` | `home` | card, heading, text, button, table |
| `/forms` | `forms` | card, heading, text, form |
| `/badges` | `badges` | card, heading, badge |

Navigate between routes using the top nav, then use **Brand Kit** → pick a category → **Validate** → **Apply** per page.

## Config

- `nuvio/brand.json` — saved brand tokens (purple accent by default)
- `nuvio/pages/*.pcc.yaml` — per-route host manifests for coverage verify

```bash
pnpm coverage:dogfood   # tailadmin only
node packages/cli/dist/cli-entry.js coverage verify --page home --cwd apps/next-dogfood
node packages/cli/dist/cli-entry.js coverage verify --page forms --cwd apps/next-dogfood
node packages/cli/dist/cli-entry.js coverage verify --page badges --cwd apps/next-dogfood
```

## Notes

- Untagged subtitle on `/` is for click-to-tag manual testing.
- Overlay CSS: `import "@nuvio/overlay/style.css"` in `src/app/layout.tsx`.
