import type { Breakpoint } from "@nuvio/shared";
import type { AlphaStylePicks } from "./alpha-patch-ops.js";
import { EMPTY_ALPHA_PICKS } from "./alpha-patch-ops.js";
import { BACKGROUND_COLOR_VALUES, TEXT_COLOR_VALUES } from "./tailwind-color-options.js";
import {
  flattenTokensAtBreakpoint,
  isBgColorUtility,
  isBorderColorUtility,
  isFontSizeUtility,
  isRoundedUtility,
  isTextColorUtility,
  lastMatchingToken,
} from "./tailwind-token-read.js";

const FONT_SIZE = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"] as const;
const FONT_WEIGHT = ["font-medium", "font-semibold", "font-bold"] as const;
const LINE_HEIGHT = ["leading-tight", "leading-snug", "leading-normal", "leading-relaxed"] as const;
const LETTER_SPACING = ["tracking-tight", "tracking-normal", "tracking-wide"] as const;
const TEXT_ALIGN = ["text-left", "text-center", "text-right", "text-justify"] as const;
const TEXT_COLOR = TEXT_COLOR_VALUES;
const BG_COLOR = BACKGROUND_COLOR_VALUES;
const PADDING = ["p-2", "p-4", "p-6", "px-4 py-2"] as const;
const PADDING_X = ["px-2", "px-4", "px-6", "px-8"] as const;
const PADDING_Y = ["py-1", "py-2", "py-4", "py-6"] as const;
const MARGIN = ["m-2", "m-4", "mx-auto", "mt-4", "mb-4"] as const;
const MARGIN_X = ["mx-2", "mx-4", "mx-6", "mx-auto"] as const;
const MARGIN_Y = ["my-1", "my-2", "my-4", "my-6"] as const;
const GAP = ["gap-1", "gap-2", "gap-4", "gap-6", "gap-8"] as const;
const FLEX_DIRECTION = ["flex-row", "flex-col"] as const;
const JUSTIFY = [
  "justify-start",
  "justify-center",
  "justify-end",
  "justify-between",
  "justify-around",
] as const;
const ITEMS = ["items-start", "items-center", "items-end", "items-stretch"] as const;
const GRID_COLS = [
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-3",
  "grid-cols-4",
  "grid-cols-6",
  "grid-cols-12",
] as const;
const ROUNDED = ["rounded-md", "rounded-lg", "rounded-xl", "rounded-full"] as const;
const BORDER_WIDTH = ["border", "border-0", "border-2", "border-4"] as const;
const BORDER_COLOR = [
  "border-white",
  "border-black",
  "border-slate-200",
  "border-slate-400",
  "border-slate-700",
  "border-slate-800",
  "border-sky-500",
] as const;
const RING_WIDTH = ["ring", "ring-0", "ring-1", "ring-2", "ring-4"] as const;
const RING_COLOR = ["ring-white", "ring-slate-400", "ring-sky-500", "ring-emerald-500"] as const;
const WIDTH = ["w-auto", "w-full", "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4"] as const;
const MAX_WIDTH = [
  "max-w-sm",
  "max-w-md",
  "max-w-lg",
  "max-w-xl",
  "max-w-2xl",
  "max-w-4xl",
  "max-w-prose",
  "max-w-full",
] as const;
const HEIGHT = ["h-auto", "h-full", "h-8", "h-12", "h-16", "h-24", "h-screen"] as const;
const MIN_HEIGHT = ["min-h-0", "min-h-full", "min-h-screen", "min-h-16", "min-h-24"] as const;
const OPACITY = [
  "opacity-0",
  "opacity-25",
  "opacity-50",
  "opacity-75",
  "opacity-100",
] as const;
const SHADOW = ["shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl"] as const;

/** Last token in document order wins (Tailwind source order). */
function lastLiteralMatch(tokens: readonly string[], candidates: readonly string[]): string {
  let hit = "";
  for (const t of tokens) {
    if (candidates.includes(t)) {
      hit = t;
    }
  }
  return hit;
}

/** Prefer allowlisted value; otherwise last token matching `matches`. */
function lastPick(
  tokens: readonly string[],
  candidates: readonly string[],
  matches?: (token: string) => boolean,
): string {
  const allowlisted = lastLiteralMatch(tokens, candidates);
  if (allowlisted) {
    return allowlisted;
  }
  if (matches) {
    return lastMatchingToken(tokens, matches);
  }
  return "";
}

/** Match panel composite utilities like `px-4 py-2`. */
function lastCompositeMatch(tokens: readonly string[], composites: readonly string[]): string {
  let hit = "";
  for (const composite of composites) {
    const parts = composite.split(/\s+/).filter(Boolean);
    if (parts.length > 0 && parts.every((p) => tokens.includes(p))) {
      hit = composite;
    }
  }
  return hit;
}

/**
 * Map a host element's `class` attribute to staged pick values (panel dropdowns).
 * Resolves responsive (`md:`) and variant (`dark:`) prefixes for the active breakpoint.
 */
export function readAlphaPicksFromClassName(
  className: string,
  activeBreakpoint: Breakpoint = "base",
): AlphaStylePicks {
  const tokens = flattenTokensAtBreakpoint(className, activeBreakpoint);
  if (tokens.length === 0) {
    return { ...EMPTY_ALPHA_PICKS };
  }
  return {
    fontSize: lastPick(tokens, FONT_SIZE, isFontSizeUtility),
    fontWeight: lastLiteralMatch(tokens, FONT_WEIGHT),
    lineHeight: lastLiteralMatch(tokens, LINE_HEIGHT),
    letterSpacing: lastLiteralMatch(tokens, LETTER_SPACING),
    textAlign: lastLiteralMatch(tokens, TEXT_ALIGN),
    textColor: lastPick(tokens, TEXT_COLOR, isTextColorUtility),
    bgColor: lastPick(tokens, BG_COLOR, isBgColorUtility),
    padding: lastCompositeMatch(tokens, PADDING) || lastLiteralMatch(tokens, PADDING),
    paddingX: lastLiteralMatch(tokens, PADDING_X),
    paddingY: lastLiteralMatch(tokens, PADDING_Y),
    margin: lastLiteralMatch(tokens, MARGIN),
    marginX: lastLiteralMatch(tokens, MARGIN_X),
    marginY: lastLiteralMatch(tokens, MARGIN_Y),
    gap: lastLiteralMatch(tokens, GAP),
    flexDirection: lastLiteralMatch(tokens, FLEX_DIRECTION),
    justify: lastLiteralMatch(tokens, JUSTIFY),
    items: lastLiteralMatch(tokens, ITEMS),
    gridCols: lastLiteralMatch(tokens, GRID_COLS),
    rounded: lastPick(tokens, ROUNDED, isRoundedUtility),
    borderWidth: lastLiteralMatch(tokens, BORDER_WIDTH),
    borderColor: lastPick(tokens, BORDER_COLOR, isBorderColorUtility),
    ringWidth: lastLiteralMatch(tokens, RING_WIDTH),
    ringColor: lastLiteralMatch(tokens, RING_COLOR),
    width: lastLiteralMatch(tokens, WIDTH),
    maxWidth: lastLiteralMatch(tokens, MAX_WIDTH),
    height: lastLiteralMatch(tokens, HEIGHT),
    minHeight: lastLiteralMatch(tokens, MIN_HEIGHT),
    opacity: lastLiteralMatch(tokens, OPACITY),
    shadow: lastLiteralMatch(tokens, SHADOW),
  };
}

export function readAlphaPicksFromElement(
  el: HTMLElement,
  activeBreakpoint: Breakpoint = "base",
): AlphaStylePicks {
  return readAlphaPicksFromClassName(el.className, activeBreakpoint);
}

export function alphaPicksDiffer(a: AlphaStylePicks, b: AlphaStylePicks): boolean {
  return (Object.keys(EMPTY_ALPHA_PICKS) as (keyof AlphaStylePicks)[]).some((k) => a[k] !== b[k]);
}
