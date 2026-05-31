import type { Breakpoint } from "@nuvio/shared";

const BREAKPOINT_LABELS: Record<Breakpoint, string> = {
  base: "All screen sizes",
  sm: "Mobile (sm)",
  md: "Tablet (md)",
  lg: "Desktop (lg)",
  xl: "Large desktop (xl)",
};

export function formatPlainBreakpointLabel(bp: Breakpoint): string {
  return BREAKPOINT_LABELS[bp] ?? bp;
}
