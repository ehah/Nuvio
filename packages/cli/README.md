# @nuvio/cli

Onboarding and diagnostics for nuvio in **Vite** and **Next.js** React + Tailwind projects.

```bash
pnpm dlx @nuvio/cli init --yes
pnpm dev
```

`init` detects Vite vs Next and wires the correct adapter (`@nuvio/vite-plugin` or `@nuvio/next` + custom dev server).

**Commands:** `init` · `doctor` · `scan` · `stats` · `brand scan|apply` · `coverage verify`

Monorepos: use `--app <dir>` or `--all-apps`. See [docs/mds/MONOREPO.md](../../docs/mds/MONOREPO.md).

**Next.js:** [docs/mds/NEXT.md](../../docs/mds/NEXT.md) · dogfood: [apps/next-dogfood](../../apps/next-dogfood/)

See [nuvio user guide](https://github.com/ehah/Nuvio/blob/main/docs/nuvioUser.md) and [CHANGELOG](../../CHANGELOG.md).

## Telemetry

nuvio collects anonymous usage metrics to improve onboarding and reliability. No source code, file contents, file paths, project names, emails, or personal data are sent.

Disable anytime with:

```bash
NUVIO_TELEMETRY=0
```

See [PostHog_telemetry.md](https://github.com/ehah/Nuvio/blob/main/docs/PostHog_telemetry.md).
