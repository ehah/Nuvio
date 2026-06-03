import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function buildPlugins() {
  return [react()];
}

export default defineConfig({
  plugins: buildPlugins(),
});
