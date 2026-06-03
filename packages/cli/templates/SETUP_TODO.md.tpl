<!-- nuvio-cli-template: 1 -->
# Nuvio setup — manual steps

@nuvio/cli could not safely patch: {{FAILED_STEPS}}

## Vite (if needed)

Add to `vite.config.ts`:

```ts
import { nuvio } from "@nuvio/vite-plugin";
// inside defineConfig:
plugins: [react(), nuvio()],
resolve: { dedupe: ["react", "react-dom"] },
```

## App shell (if needed)

```tsx
import { NuvioDevShell } from "@nuvio/overlay";
// inside root component return:
<NuvioDevShell />
```

## Starter id (if needed)

Add to one visible heading: `data-nuvio-id="page.title"`
