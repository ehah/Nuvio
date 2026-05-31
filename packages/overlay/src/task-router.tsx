import type { IndexWireEntry, RowWireTarget } from "@nuvio/shared";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { buildSimpleBackNav, isTableCellId } from "./simple-mode-nav.js";
import type { SimpleBackNav } from "./simple-mode-nav.js";
import {
  formatCardDisplayName,
  formatCardGroupName,
  formatColumnHeaderTitle,
  formatTableDisplayName,
  resolveTableHostPrefix,
} from "./human-naming.js";
import {
  BUTTON_MENU,
  FORM_MENU,
  NAV_MENU,
  SECTION_MENU,
  type ButtonTask,
  type ChartTask,
  type FormTask,
  type NavTask,
  type SectionTask,
  type SimpleRouterMode,
  buttonTaskControls,
  chartPrefixFromId,
  chartTargetForTask,
  chartTaskControls,
  detectSimpleRouterMode,
  formPrefixFromId,
  formTargetForTask,
  formTaskControls,
  inferButtonTask,
  inferChartTask,
  inferFormTask,
  inferNavTask,
  inferSectionTask,
  listNavTargets,
  navTaskControls,
  sectionTargetForTask,
  sectionTaskControls,
} from "./task-router-modes.js";

export type { SimpleRouterMode };
export { detectSimpleRouterMode };

export type CardTask = "menu" | "label" | "value" | "cardStyle";

export type TableTask = "menu" | "tableTitle" | "columnHeaders" | "rows" | "tableStyle";

export { type ButtonTask, type FormTask, type NavTask, type ChartTask, type SectionTask };

export function resolveCardContext(
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

export function inferCardTask(selectedId: string, cardId: string): CardTask {
  if (selectedId.endsWith(".label")) {
    return "label";
  }
  if (selectedId.endsWith(".value")) {
    return "value";
  }
  if (selectedId === cardId) {
    return "menu";
  }
  return "menu";
}

function tablePrefixFromEntry(
  entry: IndexWireEntry,
  indexEntries?: readonly IndexWireEntry[],
): string {
  return resolveTableHostPrefix(entry.id, indexEntries);
}

function headerEntries(entry: IndexWireEntry, all: readonly IndexWireEntry[]): IndexWireEntry[] {
  const prefix = tablePrefixFromEntry(entry, all);
  return all.filter((e) => e.id.startsWith(`${prefix}.header.`) && e.id !== `${prefix}.header.row`);
}

export function inferTableTask(
  selectedId: string,
  prefix: string,
  headers: readonly IndexWireEntry[],
  rows: readonly { nuvioId: string }[],
): TableTask {
  if (selectedId === `${prefix}.title`) {
    return "tableTitle";
  }
  if (selectedId.includes(".header.")) {
    return "columnHeaders";
  }
  if (selectedId.includes(".row.")) {
    return "rows";
  }
  if (headers.some((h) => h.id === selectedId)) {
    return "columnHeaders";
  }
  if (rows.some((r) => r.nuvioId === selectedId || selectedId.startsWith(`${r.nuvioId}.`))) {
    return "rows";
  }
  if (selectedId === `${prefix}.section` || selectedId === `${prefix}.table`) {
    return "menu";
  }
  return "menu";
}

export function cardTargetIdForTask(
  prefix: string,
  task: CardTask,
  indexEntries: readonly IndexWireEntry[],
): string {
  if (task === "label") {
    return indexEntries.find((e) => e.id === `${prefix}.label`)?.id ?? `${prefix}.label`;
  }
  if (task === "value") {
    return indexEntries.find((e) => e.id === `${prefix}.value`)?.id ?? `${prefix}.value`;
  }
  return indexEntries.find((e) => e.id === `${prefix}.card`)?.id ?? `${prefix}.card`;
}

export function tableTargetIdForTask(
  prefix: string,
  task: TableTask,
  indexEntries: readonly IndexWireEntry[],
  headers: readonly IndexWireEntry[],
  rows: readonly { nuvioId: string }[],
): string | null {
  if (task === "tableTitle") {
    return indexEntries.find((e) => e.id === `${prefix}.title`)?.id ?? null;
  }
  if (task === "tableStyle") {
    return indexEntries.find((e) => e.id === `${prefix}.section`)?.id ?? `${prefix}.section`;
  }
  if (task === "columnHeaders") {
    return headers[0]?.id ?? null;
  }
  if (task === "rows") {
    return rows[0]?.nuvioId ?? null;
  }
  return null;
}

export type CardTaskControls = {
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

const EMPTY_CONTROLS: CardTaskControls = {
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

export function cardTaskControls(task: CardTask): CardTaskControls {
  switch (task) {
    case "label":
    case "value":
      return {
        ...EMPTY_CONTROLS,
        showText: true,
        showTextColor: true,
        showFontSize: true,
        showFontWeight: true,
      };
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

export type TableTaskControls = CardTaskControls;

export function tableTaskControls(task: TableTask): TableTaskControls {
  switch (task) {
    case "tableTitle":
    case "columnHeaders":
    case "rows":
      return {
        ...EMPTY_CONTROLS,
        showText: true,
        showTextColor: true,
      };
    case "tableStyle":
      return {
        ...EMPTY_CONTROLS,
        showBackground: true,
        showPadding: true,
        showRadius: true,
        showShadow: true,
        showHideShow: true,
      };
    default:
      return cardTaskControls("menu");
  }
}

type TaskMenuItem = { task: string; label: string; icon?: string; hint?: string };

function previewForTargetId(id: string, indexEntries: readonly IndexWireEntry[]): string | undefined {
  const entry = indexEntries.find((e) => e.id === id);
  return (
    entry?.textTargets?.find((t) => t.nuvioId === id)?.textPreview ??
    entry?.textTargets?.[0]?.textPreview
  );
}

function quoteHint(preview: string | undefined, fallback: string): string {
  if (!preview) {
    return fallback;
  }
  const trimmed = preview.length > 36 ? `${preview.slice(0, 33)}…` : preview;
  return `Change “${trimmed}”`;
}

function buildCardMenuItems(prefix: string, indexEntries: readonly IndexWireEntry[]): TaskMenuItem[] {
  return [
    {
      task: "label",
      label: "Label",
      icon: "📝",
      hint: quoteHint(previewForTargetId(`${prefix}.label`, indexEntries), "Change the label text"),
    },
    {
      task: "value",
      label: "Value",
      icon: "🔢",
      hint: quoteHint(previewForTargetId(`${prefix}.value`, indexEntries), "Change the value"),
    },
    {
      task: "cardStyle",
      label: "Card Style",
      icon: "🎨",
      hint: "Background, spacing, radius",
    },
  ];
}

function buildTableMenuItems(
  tablePrefix: string,
  indexEntries: readonly IndexWireEntry[],
  headers: readonly IndexWireEntry[],
): TaskMenuItem[] {
  const headerHint =
    headers.length > 0
      ? headers
          .map((h) => previewForTargetId(h.id, indexEntries) ?? formatColumnHeaderTitle(h.id, h, indexEntries))
          .slice(0, 4)
          .join(", ")
      : "Edit column names";
  return [
    {
      task: "tableTitle",
      label: "Title",
      icon: "📝",
      hint: quoteHint(previewForTargetId(`${tablePrefix}.title`, indexEntries), "Change the table title"),
    },
    { task: "columnHeaders", label: "Column Headers", icon: "🧱", hint: headerHint },
    { task: "rows", label: "Rows", icon: "📄", hint: "Product names and values" },
    { task: "tableStyle", label: "Table Style", icon: "🎨", hint: "Background, spacing, radius" },
  ];
}

function buildChartMenuItems(chartPrefix: string, indexEntries: readonly IndexWireEntry[]): TaskMenuItem[] {
  return [
    {
      task: "title",
      label: "Title",
      icon: "📝",
      hint: quoteHint(previewForTargetId(`${chartPrefix}.title`, indexEntries), "Change the chart title"),
    },
    {
      task: "subtitle",
      label: "Subtitle",
      icon: "💬",
      hint: quoteHint(previewForTargetId(`${chartPrefix}.subtitle`, indexEntries), "Change the subtitle"),
    },
    { task: "cardStyle", label: "Card Style", icon: "🎨", hint: "Background, spacing, radius" },
  ];
}

const CARD_MENU: readonly { task: CardTask; label: string }[] = [
  { task: "label", label: "Label" },
  { task: "value", label: "Value" },
  { task: "cardStyle", label: "Card Style" },
];

const TABLE_MENU: readonly { task: TableTask; label: string }[] = [
  { task: "tableTitle", label: "Table Title" },
  { task: "columnHeaders", label: "Column Headers" },
  { task: "rows", label: "Rows" },
  { task: "tableStyle", label: "Table Style" },
];

export function TaskMenu({
  title,
  items,
  activeTask,
  onPick,
  onBack,
  simpleMode = false,
}: {
  title: string;
  items: readonly { task: string; label: string; icon?: string; hint?: string }[];
  activeTask: string;
  onPick: (task: string) => void;
  onBack?: () => void;
  simpleMode?: boolean;
}): ReactElement | null {
  if (simpleMode && activeTask !== "menu") {
    return null;
  }

  if (activeTask !== "menu") {
    const activeItem = items.find((i) => i.task === activeTask);
    const activeLabel = activeItem?.label ?? title;
    return (
      <section className="nuvio-card nuvio-stack-2">
        <div className="nuvio-row-wrap nuvio-row-wrap--between">
          <h3 className="nuvio-section-title">
            {simpleMode && activeItem?.icon ? `${activeItem.icon} ${activeLabel}` : activeLabel}
          </h3>
          {onBack ? (
            <button type="button" className="nuvio-button-chip" onClick={onBack}>
              ← Back
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="nuvio-card nuvio-stack-2">
      <h3 className="nuvio-section-title">{title}</h3>
      <p className="nuvio-text-2xs nuvio-text-muted">What would you like to change?</p>
      <div className="nuvio-stack-1">
        {items.map((item) =>
          simpleMode ? (
            <button
              key={item.task}
              type="button"
              className="nuvio-task-card"
              onClick={() => onPick(item.task)}
            >
              <span className="nuvio-task-card-icon" aria-hidden="true">
                {item.icon ?? "✏️"}
              </span>
              <span className="nuvio-task-card-body">
                <span className="nuvio-task-card-title">{item.label}</span>
                {item.hint ? <span className="nuvio-task-card-hint">{item.hint}</span> : null}
              </span>
            </button>
          ) : (
            <button
              key={item.task}
              type="button"
              className="nuvio-button nuvio-button--block"
              onClick={() => onPick(item.task)}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </section>
  );
}

export type SimpleTaskRouterProps = {
  mode: SimpleRouterMode | null;
  entry: IndexWireEntry | undefined;
  indexEntries: readonly IndexWireEntry[];
  selectedId: string;
  onSelectId: (id: string) => void;
};

export function useSimpleTaskRouter({
  mode,
  entry,
  indexEntries,
  selectedId,
  onSelectId,
}: SimpleTaskRouterProps): {
  active: boolean;
  cardTask: CardTask;
  tableTask: TableTask;
  buttonTask: ButtonTask;
  formTask: FormTask;
  navTask: NavTask;
  chartTask: ChartTask;
  sectionTask: SectionTask;
  cardMenu: ReactElement | null;
  tableMenu: ReactElement | null;
  buttonMenu: ReactElement | null;
  formMenu: ReactElement | null;
  navMenu: ReactElement | null;
  chartMenu: ReactElement | null;
  sectionMenu: ReactElement | null;
  controls: CardTaskControls;
  showTaskControls: boolean;
  presetContext: "card" | "text" | "button" | "section" | null;
  tableHeaders: IndexWireEntry[];
  tableRows: RowWireTarget[];
  tablePrefix: string;
  navTargets: IndexWireEntry[];
  backNav: SimpleBackNav | null;
  isDirectTableFieldEdit: boolean;
} {
  const enabled = Boolean(mode && entry);
  const [pickedCardTask, setPickedCardTask] = useState<CardTask | null>(null);
  const [pickedTableTask, setPickedTableTask] = useState<TableTask | null>(null);
  const [pickedButtonTask, setPickedButtonTask] = useState<ButtonTask | null>(null);
  const [pickedFormTask, setPickedFormTask] = useState<FormTask | null>(null);
  const [pickedNavTask, setPickedNavTask] = useState<NavTask | null>(null);
  const [pickedChartTask, setPickedChartTask] = useState<ChartTask | null>(null);
  const [pickedSectionTask, setPickedSectionTask] = useState<SectionTask | null>(null);

  const cardCtx = useMemo(
    () => (enabled && mode === "card" ? resolveCardContext(selectedId, indexEntries) : null),
    [enabled, mode, selectedId, indexEntries],
  );

  const chartPrefix = useMemo(
    () => (enabled && mode === "chart" ? chartPrefixFromId(selectedId) : ""),
    [enabled, mode, selectedId],
  );

  const formPrefix = useMemo(
    () => (enabled && mode === "form" ? formPrefixFromId(selectedId) : ""),
    [enabled, mode, selectedId],
  );

  const tablePrefix = useMemo(
    () => (enabled && mode === "table" && entry ? tablePrefixFromEntry(entry, indexEntries) : ""),
    [enabled, entry, indexEntries, mode],
  );
  const headers = useMemo(
    () => (enabled && mode === "table" && entry ? headerEntries(entry, indexEntries) : []),
    [enabled, entry, indexEntries, mode],
  );
  const rows = entry?.rowTargets ?? [];
  const navTargets = useMemo(
    () => (enabled && mode === "nav" ? listNavTargets(indexEntries) : []),
    [enabled, indexEntries, mode],
  );

  useEffect(() => {
    setPickedCardTask(null);
    setPickedTableTask(null);
    setPickedButtonTask(null);
    setPickedFormTask(null);
    setPickedNavTask(null);
    setPickedChartTask(null);
    setPickedSectionTask(null);
  }, [selectedId]);

  const inferredCardTask = cardCtx ? inferCardTask(selectedId, cardCtx.cardId) : "menu";
  const cardTask = pickedCardTask ?? inferredCardTask;

  const inferredTableTask =
    enabled && mode === "table" ? inferTableTask(selectedId, tablePrefix, headers, rows) : "menu";
  const tableTask = pickedTableTask ?? inferredTableTask;

  const buttonTask = pickedButtonTask ?? inferButtonTask(selectedId);
  const formTask = pickedFormTask ?? inferFormTask(selectedId);
  const navTask = pickedNavTask ?? inferNavTask(selectedId);
  const chartTask =
    pickedChartTask ??
    (enabled && mode === "chart" ? inferChartTask(selectedId, chartPrefix) : "menu");
  const sectionTask = pickedSectionTask ?? inferSectionTask(selectedId);

  useEffect(() => {
    if (!enabled || mode !== "card" || !cardCtx || cardTask === "menu") {
      return;
    }
    const targetId = cardTargetIdForTask(cardCtx.prefix, cardTask, indexEntries);
    if (targetId && selectedId !== targetId) {
      onSelectId(targetId);
    }
  }, [cardCtx, cardTask, enabled, indexEntries, mode, onSelectId, selectedId]);

  useEffect(() => {
    if (!enabled || mode !== "table" || tableTask === "menu") {
      return;
    }
    const targetId = tableTargetIdForTask(tablePrefix, tableTask, indexEntries, headers, rows);
    if (targetId && selectedId !== targetId) {
      onSelectId(targetId);
    }
  }, [enabled, headers, indexEntries, mode, onSelectId, rows, selectedId, tablePrefix, tableTask]);

  useEffect(() => {
    if (!enabled || mode !== "form" || formTask === "menu") {
      return;
    }
    const targetId = formTargetForTask(formPrefix, formTask, indexEntries);
    if (targetId && selectedId !== targetId) {
      onSelectId(targetId);
    }
  }, [enabled, formPrefix, formTask, indexEntries, mode, onSelectId, selectedId]);

  useEffect(() => {
    if (!enabled || mode !== "chart" || chartTask === "menu") {
      return;
    }
    const targetId = chartTargetForTask(chartPrefix, chartTask, indexEntries);
    if (targetId && selectedId !== targetId) {
      onSelectId(targetId);
    }
  }, [chartPrefix, chartTask, enabled, indexEntries, mode, onSelectId, selectedId]);

  useEffect(() => {
    if (!enabled || mode !== "section" || sectionTask === "menu") {
      return;
    }
    const targetId = sectionTargetForTask(selectedId, sectionTask, indexEntries);
    if (targetId && selectedId !== targetId) {
      onSelectId(targetId);
    }
  }, [enabled, indexEntries, mode, onSelectId, sectionTask, selectedId]);

  if (!enabled || !mode || !entry) {
    return {
      active: false,
      cardTask: "menu",
      tableTask: "menu",
      buttonTask: "menu",
      formTask: "menu",
      navTask: "menu",
      chartTask: "menu",
      sectionTask: "menu",
      cardMenu: null,
      tableMenu: null,
      buttonMenu: null,
      formMenu: null,
      navMenu: null,
      chartMenu: null,
      sectionMenu: null,
      controls: EMPTY_CONTROLS,
      showTaskControls: true,
      presetContext: null,
      tableHeaders: [],
      tableRows: [],
      tablePrefix: "",
      navTargets: [],
      backNav: null,
      isDirectTableFieldEdit: false,
    };
  }

  const cardTitle = cardCtx ? formatCardDisplayName(cardCtx.prefix, indexEntries) : "Card";

  const tableTitle = formatTableDisplayName(tablePrefix, indexEntries);

  const buttonTitle = `${formatCardGroupName(selectedId.split(".").slice(0, -1).join(".") || selectedId, indexEntries)} Button`;
  const formTitle = `${formatCardGroupName(formPrefix || selectedId, indexEntries)} Field`;
  const navTitle = "Navigation";
  const chartTitle = `${formatCardGroupName(chartPrefix, indexEntries)} Chart`;
  const sectionTitle = formatCardGroupName(selectedId.replace(/\.(title|heading|lead|description)$/, ""), indexEntries);

  const cardMenu =
    mode === "card" && cardCtx ? (
      <TaskMenu
        title={cardTitle}
        items={buildCardMenuItems(cardCtx.prefix, indexEntries)}
        activeTask={cardTask}
        onPick={(task) => setPickedCardTask(task as CardTask)}
        onBack={cardTask !== "menu" ? () => setPickedCardTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const tableMenu =
    mode === "table" ? (
      <TaskMenu
        title={tableTitle}
        items={buildTableMenuItems(tablePrefix, indexEntries, headers)}
        activeTask={tableTask}
        onPick={(task) => setPickedTableTask(task as TableTask)}
        onBack={tableTask !== "menu" ? () => setPickedTableTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const buttonMenu =
    mode === "button" ? (
      <TaskMenu
        title={buttonTitle}
        items={BUTTON_MENU.map((item) => ({
          ...item,
          icon: item.task === "text" ? "📝" : item.task === "color" ? "🎨" : item.task === "size" ? "📐" : "↔️",
          hint:
            item.task === "text"
              ? quoteHint(previewForTargetId(selectedId, indexEntries), "Change button text")
              : item.task === "color"
                ? "Background and text color"
                : item.task === "size"
                  ? "Padding and size"
                  : "Full width or auto",
        }))}
        activeTask={buttonTask}
        onPick={(task) => setPickedButtonTask(task as ButtonTask)}
        onBack={buttonTask !== "menu" ? () => setPickedButtonTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const formMenu =
    mode === "form" ? (
      <TaskMenu
        title={formTitle}
        items={FORM_MENU.map((item) => ({
          ...item,
          icon: item.task === "label" ? "📝" : item.task === "placeholder" ? "💬" : "📐",
          hint:
            item.task === "label"
              ? "Change the field label"
              : item.task === "placeholder"
                ? "Change placeholder text"
                : "Adjust field spacing",
        }))}
        activeTask={formTask}
        onPick={(task) => setPickedFormTask(task as FormTask)}
        onBack={formTask !== "menu" ? () => setPickedFormTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const navMenu =
    mode === "nav" ? (
      <TaskMenu
        title={navTitle}
        items={NAV_MENU.map((item) => ({
          ...item,
          icon: item.task === "navigationItems" ? "🔗" : "📐",
          hint: item.task === "navigationItems" ? "Edit link labels" : "Adjust spacing",
        }))}
        activeTask={navTask}
        onPick={(task) => setPickedNavTask(task as NavTask)}
        onBack={navTask !== "menu" ? () => setPickedNavTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const chartMenu =
    mode === "chart" ? (
      <TaskMenu
        title={chartTitle}
        items={buildChartMenuItems(chartPrefix, indexEntries)}
        activeTask={chartTask}
        onPick={(task) => setPickedChartTask(task as ChartTask)}
        onBack={chartTask !== "menu" ? () => setPickedChartTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const sectionMenu =
    mode === "section" ? (
      <TaskMenu
        title={sectionTitle}
        items={SECTION_MENU.map((item) => ({
          ...item,
          icon:
            item.task === "heading"
              ? "📝"
              : item.task === "description"
                ? "💬"
                : item.task === "background"
                  ? "🎨"
                  : "📐",
          hint:
            item.task === "heading"
              ? "Change the main heading"
              : item.task === "description"
                ? "Change supporting text"
                : item.task === "background"
                  ? "Background and layout"
                  : "Adjust spacing",
        }))}
        activeTask={sectionTask}
        onPick={(task) => setPickedSectionTask(task as SectionTask)}
        onBack={sectionTask !== "menu" ? () => setPickedSectionTask("menu") : undefined}
        simpleMode
      />
    ) : null;

  const controls =
    mode === "card"
      ? cardTaskControls(cardTask)
      : mode === "table"
        ? tableTaskControls(tableTask)
        : mode === "button"
          ? buttonTaskControls(buttonTask)
          : mode === "form"
            ? formTaskControls(formTask)
            : mode === "nav"
              ? navTaskControls(navTask)
              : mode === "chart"
                ? chartTaskControls(chartTask)
                : mode === "section"
                  ? sectionTaskControls(sectionTask)
                  : EMPTY_CONTROLS;

  const isDirectTableFieldEdit =
    mode === "table" && (isTableCellId(selectedId) || selectedId.includes(".header."));

  const showTaskControls =
    mode === "card"
      ? cardTask !== "menu"
      : mode === "table"
        ? isDirectTableFieldEdit || tableTask !== "menu"
        : mode === "button"
          ? buttonTask !== "menu"
          : mode === "form"
            ? formTask !== "menu"
            : mode === "nav"
              ? navTask !== "menu"
              : mode === "chart"
                ? chartTask !== "menu"
                : mode === "section"
                  ? sectionTask !== "menu"
                  : true;

  const presetContext =
    mode === "card" && cardTask === "cardStyle"
      ? "card"
      : mode === "table" && tableTask === "tableStyle"
        ? "card"
        : mode === "chart" && chartTask === "cardStyle"
          ? "card"
          : mode === "section" && sectionTask === "background"
            ? "section"
            : mode === "button" && buttonTask === "text"
              ? "text"
              : mode === "button"
                ? "button"
                : mode === "section" && (sectionTask === "heading" || sectionTask === "description")
                  ? "text"
                  : mode === "chart" && (chartTask === "title" || chartTask === "subtitle")
                    ? "text"
                    : mode === "form" && (formTask === "label" || formTask === "placeholder")
                      ? "text"
                      : mode === "card" && (cardTask === "label" || cardTask === "value")
                        ? "text"
                        : mode === "table" &&
                            (isDirectTableFieldEdit ||
                              tableTask === "tableTitle" ||
                              tableTask === "columnHeaders" ||
                              tableTask === "rows")
                          ? "text"
                          : null;

  const resetActiveTask = (): void => {
    setPickedCardTask(null);
    setPickedTableTask(null);
    setPickedButtonTask(null);
    setPickedFormTask(null);
    setPickedNavTask(null);
    setPickedChartTask(null);
    setPickedSectionTask(null);
  };

  const backNav = buildSimpleBackNav({
    mode,
    selectedId,
    indexEntries,
    cardPrefix: cardCtx?.prefix ?? null,
    tablePrefix,
    chartPrefix,
    formPrefix,
    cardTask,
    tableTask,
    cardTaskAtMenu: cardTask === "menu",
    tableTaskAtMenu: tableTask === "menu" && !isDirectTableFieldEdit,
    buttonTaskAtMenu: buttonTask === "menu",
    formTaskAtMenu: formTask === "menu",
    chartTaskAtMenu: chartTask === "menu",
    sectionTaskAtMenu: sectionTask === "menu",
    navTaskAtMenu: navTask === "menu",
    onNavigate: onSelectId,
    onResetTask: resetActiveTask,
  });

  return {
    active: true,
    cardTask,
    tableTask,
    buttonTask,
    formTask,
    navTask,
    chartTask,
    sectionTask,
    cardMenu,
    tableMenu,
    buttonMenu,
    formMenu,
    navMenu,
    chartMenu,
    sectionMenu,
    controls,
    showTaskControls,
    presetContext,
    tableHeaders: headers,
    tableRows: rows,
    tablePrefix,
    navTargets,
    backNav,
    isDirectTableFieldEdit,
  };
}

export { CARD_MENU, TABLE_MENU };
