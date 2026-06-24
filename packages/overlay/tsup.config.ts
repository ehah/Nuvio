import { copyFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx", "src/NuvioNextShell.tsx"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@nuvio/shared", "next", "next/navigation"],
  define: {
    "import.meta.env.VITE_NUVIO_TELEMETRY": JSON.stringify(
      process.env.VITE_NUVIO_TELEMETRY ?? "",
    ),
  },
  esbuildOptions(options) {
    options.loader = { ...options.loader, ".css": "empty" };
  },
  async onSuccess() {
    await copyFile("src/styles/overlay.css", "dist/style.css");
  },
});
