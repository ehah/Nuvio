import type { AlphaStylePicks } from "./alpha-patch-ops.js";

export type PresetContext = "card" | "text" | "button" | "section" | "any";

/** Whitelist-backed utility bundles for vibe-coder presets (v0.5). */
export const STYLE_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  fragment: string;
  context: PresetContext;
}> = [
  { id: "cleaner", label: "Cleaner", fragment: "p-5 border border-gray-200", context: "card" },
  { id: "compact", label: "Compact", fragment: "p-4 gap-2", context: "card" },
  { id: "spacious", label: "Spacious", fragment: "p-8 gap-4", context: "card" },
  { id: "modern", label: "Modern", fragment: "rounded-xl shadow-sm", context: "card" },
  { id: "elevated", label: "Elevated", fragment: "rounded-xl shadow-md border", context: "card" },
  { id: "muted-text", label: "Muted", fragment: "text-gray-500 dark:text-gray-400", context: "text" },
  { id: "strong-text", label: "Strong", fragment: "font-semibold text-gray-900 dark:text-white", context: "text" },
  { id: "larger-text", label: "Larger", fragment: "text-lg", context: "text" },
  { id: "smaller-text", label: "Smaller", fragment: "text-sm", context: "text" },
  { id: "soft-cta", label: "Soft CTA", fragment: "bg-brand-50 text-brand-600", context: "button" },
  { id: "strong-cta", label: "Strong CTA", fragment: "bg-brand-500 text-white", context: "button" },
  { id: "secondary-btn", label: "Secondary", fragment: "border bg-gray-50 text-gray-700", context: "button" },
  { id: "section-compact", label: "Compact section", fragment: "py-4 px-4", context: "section" },
  { id: "section-balanced", label: "Balanced section", fragment: "py-6 px-6", context: "section" },
  { id: "section-spacious", label: "Spacious section", fragment: "py-10 px-8", context: "section" },
  // v0.4 carry-over aliases
  { id: "tighter", label: "Tighter spacing", fragment: "p-4 gap-2", context: "any" },
  { id: "card-emphasis", label: "Card emphasis", fragment: "rounded-xl shadow-md border", context: "card" },
];

export function presetsForContext(context: PresetContext): typeof STYLE_PRESETS {
  return STYLE_PRESETS.filter((p) => p.context === context || p.context === "any");
}

/** Quick Style chips for text editing in Simple Mode. */
export const QUICK_TEXT_STYLE_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  fragment: string;
}> = [
  { id: "normal", label: "Normal", fragment: "" },
  { id: "muted-text", label: "Muted", fragment: "text-gray-500 dark:text-gray-400" },
  { id: "strong-text", label: "Strong", fragment: "font-semibold text-gray-900 dark:text-white" },
  { id: "larger-text", label: "Larger", fragment: "text-lg" },
  { id: "smaller-text", label: "Smaller", fragment: "text-sm" },
];

function pickUtility(parts: readonly string[], prefixes: readonly string[]): string | undefined {
  return parts.find((x) => prefixes.some((p) => x.startsWith(p)));
}

/** Map preset utility fragments onto staged AlphaStylePicks. */
export function applyStylePresetToPicks(
  current: AlphaStylePicks,
  fragment: string,
): AlphaStylePicks {
  const parts = fragment.split(/\s+/).filter(Boolean);
  return {
    ...current,
    padding:
      pickUtility(parts, ["p-", "py-", "px-", "pt-", "pb-", "pl-", "pr-"]) ?? current.padding,
    gap: pickUtility(parts, ["gap-"]) ?? current.gap,
    rounded: pickUtility(parts, ["rounded"]) ?? current.rounded,
    textColor: pickUtility(parts, ["text-"]) ?? current.textColor,
    bgColor: pickUtility(parts, ["bg-"]) ?? current.bgColor,
    shadow: pickUtility(parts, ["shadow"]) ?? current.shadow,
    borderWidth: parts.some((p) => p === "border" || p.startsWith("border-"))
      ? "border"
      : current.borderWidth,
    fontSize: pickUtility(parts, ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"]) ??
      (parts.find((p) => p.startsWith("text-") && !p.includes("gray") && !p.includes("white") && !p.includes("brand"))
        ? parts.find((p) => p.startsWith("text-") && !p.includes("gray") && !p.includes("white") && !p.includes("brand"))
        : undefined) ??
      current.fontSize,
    fontWeight: parts.find((p) => p.startsWith("font-")) ?? current.fontWeight,
  };
}
