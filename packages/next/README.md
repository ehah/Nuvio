# @nuvio/next

Next.js dev adapter for Nuvio (v0.4 — App Router client components via custom dev server).

## Usage

1. Install `@nuvio/next`, `@nuvio/overlay`, and peer `next`.
2. Add a custom dev server (`server.js`) that calls `attachNuvioToNextServer`.
3. Mount `@nuvio/overlay` in a client layout component.

See `apps/next-dogfood` for a full example.
