import type { IndexWireEntry } from "@nuvio/shared";
import type { OnboardingGuideId } from "./onboarding-storage.js";
import { detectTableMode } from "./table-panel.js";

export type GuideContent = {
  title: string;
  body: string;
};

export const GUIDE_CONTENT: Record<OnboardingGuideId, GuideContent> = {
  welcome: {
    title: "Welcome to Nuvio",
    body: "Click something on the page → choose what to change → Preview Changes → Apply to Code. Changes save to your source files. Undo anytime. If an area isn't editable, use Copy Fix Prompt.",
  },
  "first-selection": {
    title: "You're editing this area",
    body: "Pick Label, Value, or Card Style from the menu. Open Advanced for more spacing controls when you need them.",
  },
  "button-spacing": {
    title: "Move this button",
    body: "Nudge position with More styles → Margin (or Margin X / Y). Align the whole row with Layout chips on the parent area — canvas drag is not supported.",
  },
  "table-parts": {
    title: "Table editing",
    body: "Pick Table Title, Column Headers, Rows, or Table Style first — so you edit the part you mean.",
  },
  "chart-polish": {
    title: "Chart block",
    body: "You can usually edit the title, subtitle, and card background here. Chart numbers and graphs still need Cursor unless ids and data are wired.",
  },
  "layout-row": {
    title: "Layout container",
    body: "This is a wrapper, not the headline. Use the guidance banner to jump to the title or label, or pick a child in Outline.",
  },
};

function isButtonLikeEntry(entry: IndexWireEntry): boolean {
  if (entry.hierarchyRole === "button") {
    return true;
  }
  const id = entry.id.toLowerCase();
  if (id.includes(".filter") || id.includes(".seeall") || id.includes(".button")) {
    return true;
  }
  const tag = entry.tagName?.toLowerCase();
  return tag === "button";
}

function isChartLikeEntry(entry: IndexWireEntry): boolean {
  if (entry.id.includes(".chart") || entry.id.startsWith("chart.")) {
    return true;
  }
  const name = entry.componentName?.toLowerCase() ?? "";
  return name.includes("chart") || name.includes("target") || name.includes("demographic");
}

export type ContextualGuideContext = {
  developerDetails: boolean;
  selectedId: string | null;
  selectedEntry: IndexWireEntry | undefined;
  selectionResolved: boolean;
  dismissed: ReadonlySet<string>;
  /** Container guidance banner is already visible — skip layout-row hint. */
  containerGuidanceVisible: boolean;
  /** Table task menu is showing (not editing a table part). */
  tableAtRootMenu?: boolean;
  /** User is on an active edit sub-screen — hide table guidance. */
  taskRouterShowControls?: boolean;
};

export function pickContextualGuide(ctx: ContextualGuideContext): OnboardingGuideId | null {
  if (ctx.developerDetails || !ctx.selectedId || !ctx.selectionResolved || !ctx.selectedEntry) {
    return null;
  }

  if (ctx.taskRouterShowControls) {
    return null;
  }

  const candidates: OnboardingGuideId[] = [];

  if (!ctx.dismissed.has("first-selection")) {
    candidates.push("first-selection");
  }

  if (
    detectTableMode(ctx.selectedEntry) &&
    ctx.tableAtRootMenu &&
    !ctx.dismissed.has("table-parts")
  ) {
    candidates.push("table-parts");
  }

  if (isButtonLikeEntry(ctx.selectedEntry) && !ctx.dismissed.has("button-spacing")) {
    candidates.push("button-spacing");
  }

  if (isChartLikeEntry(ctx.selectedEntry) && !ctx.dismissed.has("chart-polish")) {
    candidates.push("chart-polish");
  }

  if (
    !ctx.containerGuidanceVisible &&
    ctx.selectedEntry.textEditable === false &&
    (ctx.selectedEntry.textTargets?.length ?? 0) > 0 &&
    !ctx.dismissed.has("layout-row")
  ) {
    candidates.push("layout-row");
  }

  if (candidates.length === 0) {
    return null;
  }

  const priority: OnboardingGuideId[] = [
    "table-parts",
    "layout-row",
    "button-spacing",
    "chart-polish",
    "first-selection",
  ];

  for (const id of priority) {
    if (candidates.includes(id)) {
      return id;
    }
  }

  return candidates[0] ?? null;
}

export function shouldShowWelcome(ctx: {
  developerDetails: boolean;
  dismissed: ReadonlySet<string>;
}): boolean {
  return !ctx.developerDetails && !ctx.dismissed.has("welcome");
}
