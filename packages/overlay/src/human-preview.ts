import type { AlphaStylePicks } from "./alpha-patch-ops.js";

export type HumanPreviewLine = {
  label: string;
  before: string;
  after: string;
};

const BG_LABELS: Record<string, string> = {
  "bg-white": "white",
  "bg-black": "black",
  "bg-transparent": "transparent",
  "bg-slate-50": "light gray",
  "bg-slate-100": "gray",
  "bg-slate-800": "dark gray",
  "bg-slate-900": "near black",
  "bg-blue-500": "blue",
  "bg-sky-500": "sky blue",
  "bg-emerald-500": "green",
};

const TEXT_COLOR_LABELS: Record<string, string> = {
  "text-white": "white",
  "text-black": "black",
  "text-gray-500": "muted gray",
  "text-gray-900": "dark gray",
  "text-slate-500": "muted gray",
  "text-slate-900": "dark gray",
};

const PADDING_LABELS: Record<string, string> = {
  "p-2": "8px",
  "p-4": "16px",
  "p-6": "24px",
  "p-8": "32px",
  "px-4 py-2": "horizontal 16px, vertical 8px",
};

const ROUNDED_LABELS: Record<string, string> = {
  "rounded-md": "medium",
  "rounded-lg": "large",
  "rounded-xl": "extra large",
  "rounded-full": "pill",
};

const FONT_SIZE_LABELS: Record<string, string> = {
  "text-sm": "small",
  "text-base": "medium",
  "text-lg": "large",
  "text-xl": "extra large",
  "text-2xl": "2× large",
};

const FONT_WEIGHT_LABELS: Record<string, string> = {
  "font-medium": "medium",
  "font-semibold": "semibold",
  "font-bold": "bold",
};

function mapToken(value: string, table: Record<string, string>, field: string): string {
  if (!value) {
    return "default";
  }
  if (table[value]) {
    return table[value];
  }
  if (value.startsWith("bg-") || value.startsWith("text-")) {
    return "updated";
  }
  if (value.startsWith("p-") || value.startsWith("px-") || value.startsWith("py-")) {
    return "updated";
  }
  if (value.startsWith("rounded")) {
    return "updated";
  }
  return `${field} changed`;
}

function pushIfChanged(
  lines: HumanPreviewLine[],
  label: string,
  beforeRaw: string,
  afterRaw: string,
  beforeDisplay: string,
  afterDisplay: string,
): void {
  if (beforeRaw === afterRaw) {
    return;
  }
  const before = beforeDisplay === afterDisplay && beforeDisplay === "updated" ? "previous" : beforeDisplay || "default";
  const after = beforeDisplay === afterDisplay && afterDisplay === "updated" ? "updated" : afterDisplay || "default";
  lines.push({ label, before, after });
}

/** Human-readable preview for Simple Mode (Rule 0 — no raw utilities). */
export function buildHumanPreviewLines(input: {
  baselineText: string;
  draftText: string;
  baselinePicks: AlphaStylePicks;
  draftPicks: AlphaStylePicks;
}): HumanPreviewLine[] {
  const lines: HumanPreviewLine[] = [];
  const { baselineText, draftText, baselinePicks, draftPicks } = input;

  if (baselineText !== draftText) {
    lines.push({
      label: "Text",
      before: baselineText || "(empty)",
      after: draftText || "(empty)",
    });
  }

  pushIfChanged(
    lines,
    "Background",
    baselinePicks.bgColor,
    draftPicks.bgColor,
    mapToken(baselinePicks.bgColor, BG_LABELS, "Background"),
    mapToken(draftPicks.bgColor, BG_LABELS, "Background"),
  );
  pushIfChanged(
    lines,
    "Text color",
    baselinePicks.textColor,
    draftPicks.textColor,
    mapToken(baselinePicks.textColor, TEXT_COLOR_LABELS, "Text color"),
    mapToken(draftPicks.textColor, TEXT_COLOR_LABELS, "Text color"),
  );
  pushIfChanged(
    lines,
    "Padding",
    baselinePicks.padding,
    draftPicks.padding,
    mapToken(baselinePicks.padding, PADDING_LABELS, "Padding"),
    mapToken(draftPicks.padding, PADDING_LABELS, "Padding"),
  );
  pushIfChanged(
    lines,
    "Radius",
    baselinePicks.rounded,
    draftPicks.rounded,
    mapToken(baselinePicks.rounded, ROUNDED_LABELS, "Radius"),
    mapToken(draftPicks.rounded, ROUNDED_LABELS, "Radius"),
  );
  pushIfChanged(
    lines,
    "Size",
    baselinePicks.fontSize,
    draftPicks.fontSize,
    mapToken(baselinePicks.fontSize, FONT_SIZE_LABELS, "Size"),
    mapToken(draftPicks.fontSize, FONT_SIZE_LABELS, "Size"),
  );
  pushIfChanged(
    lines,
    "Weight",
    baselinePicks.fontWeight,
    draftPicks.fontWeight,
    mapToken(baselinePicks.fontWeight, FONT_WEIGHT_LABELS, "Weight"),
    mapToken(draftPicks.fontWeight, FONT_WEIGHT_LABELS, "Weight"),
  );

  if (baselinePicks.shadow !== draftPicks.shadow) {
    lines.push({
      label: "Shadow",
      before: baselinePicks.shadow ? "on" : "off",
      after: draftPicks.shadow ? "on" : "off",
    });
  }

  return lines;
}

export function formatHumanPreviewBlock(lines: readonly HumanPreviewLine[]): string {
  if (lines.length === 0) {
    return "No visible changes yet.";
  }
  return lines.map((line) => `${line.label}:\n  ${line.before} → ${line.after}`).join("\n\n");
}
