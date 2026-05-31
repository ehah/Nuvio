# TailAdmin dogfood (`@nuvio/tailadmin-dogfood`)

Real-world Nuvio compatibility fixture: [TailAdmin free React dashboard](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard) (Tailwind v4 + Vite 6 + React 19) wired to workspace `@nuvio/vite-plugin` and `@nuvio/overlay`.

## Run

From repo root:

```bash
pnpm install
pnpm dev:tailadmin
# or: cd apps/tailadmin-dogfood && pnpm dev
```

Open the URL Vite prints (default `http://localhost:5173/`). Click **Edit** on the Nuvio chip, select instrumented elements, **Preview Changes** → **Apply to Code** → undo.

**v0.5:** leave **Developer details** off for the vibe-coder path. Use task menus (Card, Table, Button, Form, Nav, Chart, Section) and **Outline** first.

## Instrumented ids (dashboard)

| Id | Location |
| --- | --- |
| `app.header` | `src/layout/AppHeader.tsx` |
| `app.sidebar` | `src/layout/AppSidebar.tsx` |
| `nav.dashboard` | Ecommerce link in `AppSidebar.tsx` |
| `dashboard.title` | `src/pages/Dashboard/Home.tsx` |
| `metric.customers.card` / `.label` / `.value` | `src/components/ecommerce/EcommerceMetrics.tsx` |
| `metric.orders.card` / `.label` / `.value` | same |
| `chart.sales` / `chart.sales.title` / `chart.sales.subtitle` | `src/components/ecommerce/StatisticsChart.tsx` |
| `target.monthly.card` / `.title` / `.subtitle` | `src/components/ecommerce/MonthlyTarget.tsx` |
| `demo.card` / `demo.title` / `demo.subtitle` | `src/components/ecommerce/DemographicCard.tsx` |
| `form.email.label` / `form.email.input` | `src/components/form/form-elements/DefaultInputs.tsx` |
| **Recent Orders (v0.4 table contract)** | `src/components/ecommerce/RecentOrders.tsx` |
| `orders.section` | Section card wrapper |
| `orders.title` | “Recent Orders” heading |
| `orders.filter` / `orders.seeAll` | Header buttons |
| `orders.table` | Table scroll area |
| `orders.header.row` | Header row |
| `orders.header.products` / `.category` / `.price` / `.status` | Column headers |
| `orders.row.{id}` | Each data row (`tableData.map`) |
| `orders.row.{id}.nameText` | Product name (Tier C → `tableData`) |

## Custom components

`TableCell`, `TableRow`, and other UI wrappers **must forward** `data-nuvio-id` (and `className`) to the real DOM node. See `src/components/ui/table/index.tsx`.

## Acceptance (manual)

- **v0.4 Vite alpha:** [docs/DOGFOOD.md](../../docs/DOGFOOD.md) § v0.4.0-alpha.0
- **v0.2 baseline:** [nuvio_v0.2.0.md](../../docs/nuvio_v0.2.0.md) §13.3

## Upstream

To refresh the TailAdmin tree:

```bash
cd apps && rm -rf tailadmin-dogfood && git clone --depth 1 https://github.com/TailAdmin/free-react-tailwind-admin-dashboard.git tailadmin-dogfood
```

Then re-apply Nuvio wiring (this README, `package.json`, `vite.config.ts`, `AppLayout`, `data-nuvio-id` attributes, and table component prop forwarding).
