import type { IndexWireEntry } from "@nuvio/shared";
import { detectTableMode } from "./table-panel.js";

function resolveCardContext(
  selectedId: string,
  indexEntries: readonly IndexWireEntry[],
): { prefix: string; cardId: string } | null {
  const match = selectedId.match(/^(.+)\.(card|label|value)$/);
  if (!match) {
    return null;
  }
  const prefix = match[1];
  const cardId = `${prefix}.card`;
  if (indexEntries.some((e) => e.id === cardId)) {
    return { prefix, cardId };
  }
  return null;
}

export type SimpleRouterMode =
  | "card"
  | "table"
  | "button"
  | "form"
  | "nav"
  | "chart"
  | "section";

export type ButtonTask = "menu" | "text" | "color" | "size" | "width";
export type FormTask = "menu" | "label" | "placeholder" | "spacing";
export type NavTask = "menu" | "navigationItems" | "spacing";
export type ChartTask = "menu" | "title" | "subtitle" | "cardStyle";
export type SectionTask = "menu" | "heading" | "description" | "background" | "spacing";

function isButtonLike(entry: IndexWireEntry, selectedId: string): boolean {
  if (entry.hierarchyRole === "button") {
    return true;
  }
  const id = selectedId.toLowerCase();
  if (
    id.includes(".filter") ||
    id.includes(".seeall") ||
    id.includes(".cta") ||
    id.endsWith(".button")
  ) {
    return true;
  }
  return entry.tagName?.toLowerCase() === "button";
}

function isFormLike(_entry: IndexWireEntry, selectedId: string): boolean {
  const id = selectedId.toLowerCase();
  return (
    id.includes(".label") ||
    id.includes(".input") ||
    id.includes(".placeholder") ||
    id.includes(".form.")
  );
}

function isNavLink(_entry: IndexWireEntry, selectedId: string): boolean {
  return selectedId.startsWith("nav.") && !selectedId.endsWith(".sidebar");
}

function isChartLike(entry: IndexWireEntry, selectedId: string): boolean {
  if (detectTableMode(entry)) {
    return false;
  }
  const id = selectedId.toLowerCase();
  if (id.includes(".chart") || id.startsWith("chart.")) {
    return true;
  }
  if (id.startsWith("target.monthly")) {
    return true;
  }
  if (id.startsWith("demo.") && (id.endsWith(".card") || id.includes(".title") || id.includes(".subtitle"))) {
    return true;
  }
  const name = entry.componentName?.toLowerCase() ?? "";
  return name.includes("statisticschart") || name.includes("monthlytarget") || name.includes("demographic");
}

function isSectionLike(entry: IndexWireEntry, selectedId: string): boolean {
  const id = selectedId.toLowerCase();
  if (id.includes(".header.") || detectTableMode(entry)) {
    return false;
  }
  if (id.endsWith(".heading") || id.endsWith(".lead") || id.endsWith(".description")) {
    return true;
  }
  if (id.endsWith(".title") && !id.includes(".chart") && !id.includes(".monthly") && !id.startsWith("demo.")) {
    return true;
  }
  return id === "dashboard.title" || id.startsWith("demo.hero.") || id.startsWith("demo.section.");
}

export function detectSimpleRouterMode(
  entry: IndexWireEntry | undefined,
  selectedId: string | null,
  indexEntries: readonly IndexWireEntry[],
): SimpleRouterMode | null {
  if (!entry || !selectedId) {
    return null;
  }
  if (detectTableMode(entry)) {
    return "table";
  }
  if (resolveCardContext(selectedId, indexEntries) || entry.id.endsWith(".card") || entry.hierarchyRole === "card") {
    return "card";
  }
  if (isChartLike(entry, selectedId)) {
    return "chart";
  }
  if (isButtonLike(entry, selectedId)) {
    return "button";
  }
  if (isFormLike(entry, selectedId)) {
    return "form";
  }
  if (isNavLink(entry, selectedId)) {
    return "nav";
  }
  if (isSectionLike(entry, selectedId)) {
    return "section";
  }
  return null;
}

export function chartPrefixFromId(selectedId: string): string {
  if (selectedId.startsWith("chart.")) {
    return selectedId.replace(/\.(title|subtitle|card)$/, "").replace(/\.card$/, "") || selectedId.split(".").slice(0, 2).join(".");
  }
  if (selectedId.startsWith("target.monthly")) {
    return "target.monthly";
  }
  if (selectedId.startsWith("demo.")) {
    return "demo";
  }
  return selectedId.replace(/\.(title|subtitle)$/, "");
}

export function formPrefixFromId(selectedId: string): string {
  return selectedId.replace(/\.(label|input|placeholder)$/, "");
}

export function inferButtonTask(_selectedId: string): ButtonTask {
  return "menu";
}

export function inferFormTask(selectedId: string): FormTask {
  if (selectedId.endsWith(".label")) {
    return "label";
  }
  if (selectedId.endsWith(".input") || selectedId.endsWith(".placeholder")) {
    return "placeholder";
  }
  return "menu";
}

export function inferNavTask(_selectedId: string): NavTask {
  return "navigationItems";
}

export function inferChartTask(selectedId: string, prefix: string): ChartTask {
  if (selectedId === `${prefix}.title` || selectedId.endsWith(".title")) {
    return "title";
  }
  if (selectedId === `${prefix}.subtitle` || selectedId.endsWith(".subtitle")) {
    return "subtitle";
  }
  if (selectedId.endsWith(".card") || selectedId === prefix) {
    return "menu";
  }
  return "menu";
}

export function inferSectionTask(selectedId: string): SectionTask {
  if (selectedId.endsWith(".heading") || selectedId.endsWith(".title") || selectedId.endsWith(".lead")) {
    return "heading";
  }
  if (selectedId.endsWith(".description")) {
    return "description";
  }
  return "menu";
}

export function chartTargetForTask(
  prefix: string,
  task: ChartTask,
  indexEntries: readonly IndexWireEntry[],
): string | null {
  if (task === "title") {
    return indexEntries.find((e) => e.id === `${prefix}.title`)?.id ?? null;
  }
  if (task === "subtitle") {
    return indexEntries.find((e) => e.id === `${prefix}.subtitle`)?.id ?? null;
  }
  if (task === "cardStyle") {
    const cardId =
      indexEntries.find((e) => e.id === `${prefix}.card`)?.id ??
      indexEntries.find((e) => e.id === prefix && e.hasLiteralClassName)?.id ??
      indexEntries.find((e) => e.id.startsWith(`${prefix}.`) && e.id.endsWith(".card"))?.id;
    return cardId ?? indexEntries.find((e) => e.id === "chart.sales")?.id ?? null;
  }
  return null;
}

export function formTargetForTask(
  prefix: string,
  task: FormTask,
  indexEntries: readonly IndexWireEntry[],
): string | null {
  if (task === "label") {
    return indexEntries.find((e) => e.id === `${prefix}.label`)?.id ?? null;
  }
  if (task === "placeholder") {
    return (
      indexEntries.find((e) => e.id === `${prefix}.input`)?.id ??
      indexEntries.find((e) => e.id === `${prefix}.placeholder`)?.id ??
      null
    );
  }
  if (task === "spacing") {
    return indexEntries.find((e) => e.id === `${prefix}.input`)?.id ?? null;
  }
  return null;
}

export function sectionTargetForTask(
  selectedId: string,
  task: SectionTask,
  indexEntries: readonly IndexWireEntry[],
): string | null {
  if (task === "heading") {
    const hit = indexEntries.find(
      (e) =>
        e.id === selectedId ||
        e.id.endsWith(".title") ||
        e.id.endsWith(".heading") ||
        e.id.endsWith(".lead"),
    );
    return hit?.id ?? selectedId;
  }
  if (task === "description") {
    return indexEntries.find((e) => e.id.endsWith(".description") || e.id.endsWith(".subtitle"))?.id ?? null;
  }
  if (task === "background" || task === "spacing") {
    return (
      indexEntries.find((e) => e.id === selectedId && e.hasLiteralClassName)?.id ??
      indexEntries.find((e) => e.id.endsWith(".row") || e.id.endsWith(".section"))?.id ??
      selectedId
    );
  }
  return selectedId;
}

export type TaskControls = {
  showText: boolean;
  showTextColor: boolean;
  showFontSize: boolean;
  showFontWeight: boolean;
  showBackground: boolean;
  showPadding: boolean;
  showRadius: boolean;
  showShadow: boolean;
  showHideShow: boolean;
  showWidth: boolean;
};

const EMPTY_CONTROLS: TaskControls = {
  showText: false,
  showTextColor: false,
  showFontSize: false,
  showFontWeight: false,
  showBackground: false,
  showPadding: false,
  showRadius: false,
  showShadow: false,
  showHideShow: false,
  showWidth: false,
};

export function buttonTaskControls(task: ButtonTask): TaskControls {
  switch (task) {
    case "text":
      return { ...EMPTY_CONTROLS, showText: true, showTextColor: true };
    case "color":
      return { ...EMPTY_CONTROLS, showBackground: true, showTextColor: true };
    case "size":
      return { ...EMPTY_CONTROLS, showPadding: true, showFontSize: true };
    case "width":
      return { ...EMPTY_CONTROLS, showWidth: true };
    default:
      return EMPTY_CONTROLS;
  }
}

export function formTaskControls(task: FormTask): TaskControls {
  switch (task) {
    case "label":
    case "placeholder":
      return { ...EMPTY_CONTROLS, showText: true, showTextColor: true };
    case "spacing":
      return { ...EMPTY_CONTROLS, showPadding: true };
    default:
      return EMPTY_CONTROLS;
  }
}

export function navTaskControls(task: NavTask): TaskControls {
  switch (task) {
    case "navigationItems":
      return { ...EMPTY_CONTROLS, showText: true, showTextColor: true };
    case "spacing":
      return { ...EMPTY_CONTROLS, showPadding: true };
    default:
      return EMPTY_CONTROLS;
  }
}

export function chartTaskControls(task: ChartTask): TaskControls {
  switch (task) {
    case "title":
    case "subtitle":
      return { ...EMPTY_CONTROLS, showText: true, showTextColor: true };
    case "cardStyle":
      return {
        ...EMPTY_CONTROLS,
        showBackground: true,
        showPadding: true,
        showRadius: true,
        showShadow: true,
        showHideShow: true,
      };
    default:
      return EMPTY_CONTROLS;
  }
}

export function sectionTaskControls(task: SectionTask): TaskControls {
  switch (task) {
    case "heading":
    case "description":
      return { ...EMPTY_CONTROLS, showText: true, showTextColor: true, showFontSize: true };
    case "background":
      return {
        ...EMPTY_CONTROLS,
        showBackground: true,
        showRadius: true,
        showShadow: true,
        showHideShow: true,
      };
    case "spacing":
      return { ...EMPTY_CONTROLS, showPadding: true };
    default:
      return EMPTY_CONTROLS;
  }
}

export const BUTTON_MENU = [
  { task: "text", label: "Text" },
  { task: "color", label: "Color" },
  { task: "size", label: "Size" },
  { task: "width", label: "Width" },
] as const;

export const FORM_MENU = [
  { task: "label", label: "Label" },
  { task: "placeholder", label: "Placeholder" },
  { task: "spacing", label: "Spacing" },
] as const;

export const NAV_MENU = [
  { task: "navigationItems", label: "Navigation items" },
  { task: "spacing", label: "Spacing" },
] as const;

export const CHART_MENU = [
  { task: "title", label: "Title" },
  { task: "subtitle", label: "Subtitle" },
  { task: "cardStyle", label: "Card Style" },
] as const;

export const SECTION_MENU = [
  { task: "heading", label: "Heading" },
  { task: "description", label: "Description" },
  { task: "background", label: "Background" },
  { task: "spacing", label: "Layout spacing" },
] as const;

export function listNavTargets(indexEntries: readonly IndexWireEntry[]): IndexWireEntry[] {
  return indexEntries.filter((e) => e.id.startsWith("nav."));
}
