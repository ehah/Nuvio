import type { AlphaStylePicks } from "./alpha-patch-ops.js";

/** Vibe labels → whitelist utility picks (v0.4 §6). */
export const LAYOUT_HELPERS: ReadonlyArray<{
  id: string;
  label: string;
  patch: Partial<AlphaStylePicks>;
}> = [
  { id: "stack-v", label: "Stack vertically", patch: { flexDirection: "flex-col" } },
  { id: "stack-h", label: "Row layout", patch: { flexDirection: "flex-row" } },
  {
    id: "center",
    label: "Center content",
    patch: { justify: "justify-center", items: "items-center" },
  },
  { id: "space-between", label: "Space between", patch: { justify: "justify-between" } },
  { id: "full-width", label: "Full width", patch: { width: "w-full" } },
];
