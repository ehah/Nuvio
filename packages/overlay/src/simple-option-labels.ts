/** Friendly select labels for Simple Mode (Rule 0 — hide Tailwind tokens). */

const GENERIC: Record<string, string> = {
  "": "Default",
};

const PADDING: Record<string, string> = {
  ...GENERIC,
  "p-2": "Small",
  "p-4": "Medium",
  "p-6": "Large",
  "px-4 py-2": "Compact",
};

const ROUNDED: Record<string, string> = {
  ...GENERIC,
  "rounded-md": "Medium",
  "rounded-lg": "Large",
  "rounded-xl": "Extra large",
  "rounded-full": "Pill",
};

const FONT_SIZE: Record<string, string> = {
  ...GENERIC,
  "text-sm": "Small",
  "text-base": "Medium",
  "text-lg": "Large",
  "text-xl": "Extra large",
  "text-2xl": "2× large",
};

const FONT_WEIGHT: Record<string, string> = {
  ...GENERIC,
  "font-medium": "Medium",
  "font-semibold": "Semibold",
  "font-bold": "Bold",
};

const SHADOW: Record<string, string> = {
  ...GENERIC,
  "shadow-none": "None",
  "shadow-sm": "Subtle",
  shadow: "Default",
  "shadow-md": "Medium",
  "shadow-lg": "Large",
  "shadow-xl": "Extra large",
};

const WIDTH: Record<string, string> = {
  ...GENERIC,
  "w-auto": "Auto",
  "w-full": "Full width",
  "w-1/2": "Half",
  "w-1/3": "One third",
  "w-2/3": "Two thirds",
};

export type SimpleOptionCategory =
  | "padding"
  | "rounded"
  | "fontSize"
  | "fontWeight"
  | "shadow"
  | "width"
  | "generic";

const TABLES: Record<SimpleOptionCategory, Record<string, string>> = {
  padding: PADDING,
  rounded: ROUNDED,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  shadow: SHADOW,
  width: WIDTH,
  generic: GENERIC,
};

export function friendlySelectLabel(
  value: string,
  category: SimpleOptionCategory,
  developerDetails: boolean,
): string {
  if (developerDetails) {
    return value || "—";
  }
  const table = TABLES[category];
  return table[value] ?? (value ? "Custom" : "Default");
}

export function mapSelectOptionsForSimpleMode(
  options: readonly { value: string; label: string }[],
  category: SimpleOptionCategory,
  developerDetails: boolean,
): { value: string; label: string }[] {
  if (developerDetails) {
    return [...options];
  }
  return options.map((o) => ({
    value: o.value,
    label: friendlySelectLabel(o.value, category, false),
  }));
}
