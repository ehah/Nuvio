import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactElement,
  type RefObject,
} from "react";
import type {
  BrandApplyAction,
  BrandConfig,
  Breakpoint,
  DuplicateIdError,
  IndexWireEntry,
  PatchOp,
  RuntimeDiagnostics,
  TextWireTarget,
} from "@nuvio/shared";
import { resolveBrandCategoryForEntry } from "@nuvio/shared";
import type { Point } from "./overlay-chrome-storage.js";
import { useChromeDrag } from "./useChromeDrag.js";
import { usePrevious } from "./use-previous.js";
import {
  EMPTY_ALPHA_PICKS,
  buildAlphaPatchOps,
  type AlphaStylePicks,
} from "./alpha-patch-ops.js";
import {
  alphaPicksDiffer,
  readAlphaPicksFromElement,
} from "./read-alpha-picks.js";
import { ComponentTree } from "./ComponentTree.js";
import { EditorStackVersions } from "./RuntimeDiagnosticsBlock.js";
import { SelectionMetadata } from "./SelectionMetadata.js";
import { SelectionSummary } from "./SelectionSummary.js";
import { TextTargetPicker } from "./TextTargetPicker.js";
import { resolveTextTargetElement } from "./text-target-dom.js";
import {
  formatFriendlyId,
  formatSelectionTitle,
  getSimpleBlockedEditFallback,
  getSimpleDuplicateIdPatchMessage,
  getSimpleIndexEmptyMessage,
  getSimplePatchBlockedMessage,
  getSimpleSelectErrorMessage,
  isDuplicateIndexedId,
} from "./selection-summary.js";
import { escapeAttrSelector } from "./nuvio-dom.js";
import { readEditableTextFromElement } from "./read-editable-text.js";
import {
  NUVO_GLASS_CONTENT,
  NUVO_GLASS_SHELL,
  NUVO_GLASS_SHELL_INLINE,
  NUVO_ROOT,
} from "./overlay-chrome-classes.js";
import {
  buildHideOp,
  buildMoveSiblingOp,
  buildShowOp,
} from "./structural-patch-ops.js";
import {
  formatPatchUserMessage,
  getIndexedSiblingMoveAvailability,
} from "./sibling-move.js";
import { formatPatchUserMessagePlain, getPlainPatchAction } from "./plain-patch-messages.js";
import { formatPlainBreakpointLabel } from "./breakpoint-labels.js";
import { ContainerGuidance } from "./container-guidance.js";
import {
  copyTextToClipboard,
  MAKE_TABLE_EDITABLE_SNIPPET,
} from "./fix-handoff.js";
import { ComponentModePanel } from "./component-mode.js";
import { detectTableMode } from "./table-panel.js";
import { LAYOUT_HELPERS } from "./layout-helpers.js";
import { presetsForContext, applyStylePresetToPicks, QUICK_TEXT_STYLE_PRESETS } from "./style-presets.js";
import { HandoffActionBar } from "./handoff-actions.js";
import {
  NUVO_PREVIEW_ON_PAGE_LABEL,
  SimpleModeActionBar,
  type PreviewOrigin,
} from "./simple-mode-actions.js";
import type { BrandBulkAppliedByAction, BrandBulkProgress } from "./brand-bulk-session.js";
import { BrandKitPanel } from "./brand-kit-panel.js";
import { EditorPanelTabs, type EditorPanelTab } from "./editor-panel-tabs.js";
import { captureBrandKitOpened } from "./brand-kit-telemetry.js";
import { OnboardingGuide } from "./OnboardingGuide.js";
import { buildHumanPreviewLines, formatHumanPreviewBlock } from "./human-preview.js";
import { mapSelectOptionsForSimpleMode, type SimpleOptionCategory } from "./simple-option-labels.js";
import {
  detectSimpleRouterMode,
  useSimpleTaskRouter,
} from "./task-router.js";
import {
  TableColumnHeaderPicker,
  TableRowPicker,
} from "./table-panel.js";
import {
  dismissGuide,
  loadDismissedGuides,
  type OnboardingGuideId,
} from "./onboarding-storage.js";
import { pickContextualGuide, shouldShowWelcome } from "./selection-guides.js";
import { ColorPickerRow } from "./ColorPickerRow.js";
import { BACKGROUND_COLOR_OPTIONS, TEXT_COLOR_OPTIONS } from "./tailwind-color-options.js";
import { classNameHasResponsiveUtilities } from "./tailwind-token-read.js";

/** Shared action labels — same in Simple Mode and Developer details. */
/** @deprecated Use {@link NUVO_VALIDATE_CHANGES_LABEL}. Kept for downstream importers. */
export const NUVO_PREVIEW_CHANGES_LABEL = "Validate Changes";

export const NUVO_VALIDATE_CHANGES_LABEL = "Validate Changes";

const BRAND_CATEGORY_STRIP_LABELS: Record<BrandApplyAction, string> = {
  button: "Button",
  card: "Card",
  heading: "Heading",
  text: "Text",
  table: "Table",
  form: "Form",
  badge: "Badge",
};
export const NUVO_APPLY_TO_CODE_LABEL = "Apply to Code";

export type PropertyPanelShellProps = {
  editMode: boolean;
  devicePreset: "desktop" | "tablet" | "mobile";
  onDevicePresetChange: (preset: "desktop" | "tablet" | "mobile") => void;
  activeBreakpoint: Breakpoint;
  onActiveBreakpointChange: (bp: Breakpoint) => void;
  selectedId: string | null;
  resolvedFile: string | undefined;
  resolvedLine: number | undefined;
  /** From server `indexReady`; must be greater than 0 for patchApply to resolve ids. */
  indexIdCount: number;
  knownIds: ReadonlySet<string>;
  duplicateErrors: readonly DuplicateIdError[];
  selectError: string | null;
  channelReady: boolean;
  previewSummary: string | null;
  previewError: string | null;
  lastPatchError: string | null;
  stagedVersion: number;
  previewValidatedFingerprint: string | null;
  /** Ops from the last successful Validate (style or structural). */
  previewValidatedOps: readonly PatchOp[] | null;
  /** Latest validate was started from Layout & structure (not style Validate). */
  structuralPreviewActive: boolean;
  undoStackDepth: number;
  previewBusy: boolean;
  onStagedPatchFingerprint: (fingerprint: string) => void;
  onRequestPreview: (ops: PatchOp[], patchHostId: string, origin?: PreviewOrigin) => void;
  onRequestBrandBulkPreview: (
    action: BrandApplyAction,
    brandConfig: BrandConfig,
    targets: Array<{ hostId: string; ops: PatchOp[] }>,
    summaryLabel: string,
  ) => void;
  onRequestBrandBulkApply: () => void;
  onBrandSaved: () => void;
  onBrandDraftChange: (draft: BrandConfig) => void;
  onBrandRouteChange?: () => void;
  onRequestApply: (ops: PatchOp[], patchHostId: string) => void;
  onRequestUndo: () => void;
  onCancelPreview: () => void;
  previewOrigin: PreviewOrigin;
  brandPreviewSummary: string | null;
  brandBulkProgress: BrandBulkProgress | null;
  brandBulkApplyReady: boolean;
  brandBulkValidatedAction: BrandApplyAction | null;
  brandBulkValidatedConfig: BrandConfig | null;
  brandBulkAppliedByAction: BrandBulkAppliedByAction;
  brandPagePreviewActive: boolean;
  onRequestBrandPagePreview: () => void;
  onRevertBrandPagePreview: () => void;
  shellRef: RefObject<HTMLElement | null>;
  panelCollapsed: boolean;
  panelPosition: Point | null;
  onPanelCollapsedChange: (collapsed: boolean) => void;
  onPanelPositionChange: (position: Point | null) => void;
  onResetPanelPosition: () => void;
  indexEntries: readonly IndexWireEntry[];
  onSelectIndexedId: (id: string) => void;
  /** Validate/apply structural ops (move, hide, duplicate) without mixing style staging. */
  onRequestStructuralPreview: (ops: PatchOp[]) => void;
  runtimeDiagnostics: RuntimeDiagnostics | null;
  developerDetails: boolean;
  onDeveloperDetailsChange: (enabled: boolean) => void;
  activeTextTargetKey: string | null;
  onActiveTextTargetKeyChange: (key: string) => void;
  hoverTextTargetKey: string | null;
  onHoverTextTargetKeyChange: (key: string | null) => void;
};

function assignShellRef(
  shellRef: RefObject<HTMLElement | null>,
  el: HTMLElement | null,
): void {
  (shellRef as MutableRefObject<HTMLElement | null>).current = el;
}

/** Ensure the live class token appears in the list so the select is not blank. */
function withCurrentOption(
  options: { value: string; label: string }[],
  current: string,
): { value: string; label: string }[] {
  if (!current || options.some((o) => o.value === current)) {
    return options;
  }
  return [...options, { value: current, label: current }];
}

function SelectRow({
  label,
  value,
  onChange,
  options,
  developerDetails = true,
  simpleCategory,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  developerDetails?: boolean;
  simpleCategory?: SimpleOptionCategory;
}): ReactElement {
  const mapped =
    simpleCategory && !developerDetails
      ? mapSelectOptionsForSimpleMode(options, simpleCategory, false)
      : options;
  const resolvedOptions = withCurrentOption(mapped, value);
  if (
    !developerDetails &&
    simpleCategory &&
    value &&
    !resolvedOptions.some((o) => o.value === value)
  ) {
    resolvedOptions.push({
      value,
      label: mapSelectOptionsForSimpleMode([{ value, label: value }], simpleCategory, false)[0]
        ?.label ?? "Custom",
    });
  }
  return (
    <label className="nuvio-field-row">
      <span className="nuvio-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="nuvio-control nuvio-select"
      >
        {resolvedOptions.map((o) => (
          <option key={o.value || "__none"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type DevicePreset = PropertyPanelShellProps["devicePreset"];

function DeviceBreakpointPanel({
  devicePreset,
  onDevicePresetChange,
  activeBreakpoint,
  onActiveBreakpointChange,
  developerDetails,
  variant,
}: {
  devicePreset: DevicePreset;
  onDevicePresetChange: (preset: DevicePreset) => void;
  activeBreakpoint: Breakpoint;
  onActiveBreakpointChange: (bp: Breakpoint) => void;
  developerDetails: boolean;
  variant: "section" | "compact";
}): ReactElement {
  const controls = (
    <>
      <div className="nuvio-row-wrap">
        <button
          type="button"
          className={`nuvio-button-chip ${devicePreset === "desktop" ? "nuvio-button-chip--active" : ""}`}
          onClick={() => onDevicePresetChange("desktop")}
        >
          Desktop
        </button>
        <button
          type="button"
          className={`nuvio-button-chip ${devicePreset === "tablet" ? "nuvio-button-chip--active" : ""}`}
          onClick={() => onDevicePresetChange("tablet")}
        >
          Tablet
        </button>
        <button
          type="button"
          className={`nuvio-button-chip ${devicePreset === "mobile" ? "nuvio-button-chip--active" : ""}`}
          onClick={() => onDevicePresetChange("mobile")}
        >
          Mobile
        </button>
      </div>
      <SelectRow
        label={developerDetails ? "Active BP" : "Applies on"}
        value={activeBreakpoint}
        onChange={(v) => onActiveBreakpointChange(v as Breakpoint)}
        options={[
          { value: "base", label: developerDetails ? "base" : formatPlainBreakpointLabel("base") },
          { value: "sm", label: developerDetails ? "sm" : formatPlainBreakpointLabel("sm") },
          { value: "md", label: developerDetails ? "md" : formatPlainBreakpointLabel("md") },
          { value: "lg", label: developerDetails ? "lg" : formatPlainBreakpointLabel("lg") },
          { value: "xl", label: developerDetails ? "xl" : formatPlainBreakpointLabel("xl") },
        ]}
        developerDetails={developerDetails}
      />
      {!developerDetails ? (
        <p className="nuvio-text-2xs nuvio-text-muted">
          Applies on:{" "}
          <span className="nuvio-font-medium">{formatPlainBreakpointLabel(activeBreakpoint)}</span>
        </p>
      ) : null}
    </>
  );

  if (variant === "compact") {
    return (
      <div className="nuvio-stack-1">
        <p className="nuvio-label">Responsive preview</p>
        {controls}
      </div>
    );
  }

  return (
    <section className="nuvio-card nuvio-stack-2">
      <h3 className="nuvio-section-title">Device + breakpoint</h3>
      {controls}
    </section>
  );
}

export function PropertyPanelShell({
  editMode,
  devicePreset,
  onDevicePresetChange,
  activeBreakpoint,
  onActiveBreakpointChange,
  selectedId,
  resolvedFile,
  resolvedLine,
  indexIdCount,
  knownIds,
  duplicateErrors,
  selectError,
  channelReady,
  previewSummary,
  previewError,
  lastPatchError,
  stagedVersion,
  previewValidatedFingerprint,
  previewValidatedOps,
  structuralPreviewActive,
  undoStackDepth,
  previewBusy,
  onStagedPatchFingerprint,
  onRequestPreview,
  onRequestBrandBulkPreview,
  onRequestBrandBulkApply,
  onBrandSaved,
  onBrandDraftChange,
  onBrandRouteChange,
  onRequestApply,
  onRequestUndo,
  onCancelPreview,
  previewOrigin,
  brandPreviewSummary,
  brandBulkProgress,
  brandBulkApplyReady,
  brandBulkValidatedAction,
  brandBulkValidatedConfig,
  brandBulkAppliedByAction,
  brandPagePreviewActive,
  onRequestBrandPagePreview,
  onRevertBrandPagePreview,
  shellRef,
  panelCollapsed,
  panelPosition,
  onPanelCollapsedChange,
  onPanelPositionChange,
  onResetPanelPosition,
  indexEntries,
  onSelectIndexedId,
  onRequestStructuralPreview,
  runtimeDiagnostics,
  developerDetails,
  onDeveloperDetailsChange,
  activeTextTargetKey,
  onActiveTextTargetKeyChange,
  hoverTextTargetKey,
  onHoverTextTargetKeyChange,
}: PropertyPanelShellProps): ReactElement {
  void hoverTextTargetKey;
  type StyleTargetMode = "container" | "text";
  const internalShellRef = useRef<HTMLElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const autoValidateTimerRef = useRef<number | null>(null);
  const lastAutoValidatedFpRef = useRef<string | null>(null);
  const prevStagedFpForBrandRef = useRef<string | null>(null);
  const [brandPreviewClearedNotice, setBrandPreviewClearedNotice] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<EditorPanelTab>("brand");
  const [missing, setMissing] = useState(false);
  const [patchTargetError, setPatchTargetError] = useState<string | null>(null);
  const [styleTargetMode, setStyleTargetMode] = useState<StyleTargetMode>("container");
  const [draftText, setDraftText] = useState("");
  const [baselineText, setBaselineText] = useState("");
  const [baselinePicks, setBaselinePicks] = useState<AlphaStylePicks>(EMPTY_ALPHA_PICKS);
  const [picks, setPicks] = useState<AlphaStylePicks>(EMPTY_ALPHA_PICKS);
  const priorPicks = usePrevious(picks);
  const [textEditable, setTextEditable] = useState(true);
  const [textEditReason, setTextEditReason] = useState<string | null>(null);
  const [dismissedGuides, setDismissedGuides] = useState<ReadonlySet<string>>(() =>
    loadDismissedGuides(),
  );

  const dismissOnboardingGuide = useCallback((id: OnboardingGuideId) => {
    setDismissedGuides(dismissGuide(id));
  }, []);

  const prevEditMode = usePrevious(editMode);
  useEffect(() => {
    if (editMode && !prevEditMode) {
      setEditorTab("brand");
    }
  }, [editMode, prevEditMode]);

  const setShellElement = useCallback(
    (el: HTMLElement | null) => {
      internalShellRef.current = el;
      assignShellRef(shellRef, el);
    },
    [shellRef],
  );

  const [livePanelPosition, setLivePanelPosition] = useState<Point | null>(panelPosition);

  const { dragging: panelDragging, onHeaderPointerDown } = useChromeDrag({
    shellRef: internalShellRef,
    enabled: !panelCollapsed,
    position: livePanelPosition,
    setPosition: (next) => {
      if (next) {
        setLivePanelPosition(next);
      }
    },
    onDragEnd: onPanelPositionChange,
  });

  useEffect(() => {
    if (!panelDragging) {
      setLivePanelPosition(panelPosition);
    }
  }, [panelPosition, panelDragging]);

  const displayPanelPosition = livePanelPosition;

  const tabOnRight =
    displayPanelPosition != null &&
    typeof window !== "undefined" &&
    displayPanelPosition.x > window.innerWidth / 2;

  const selectedEntry = useMemo(
    () => (selectedId ? indexEntries.find((e) => e.id === selectedId) : undefined),
    [indexEntries, selectedId],
  );

  const simpleRouterMode = useMemo(
    () =>
      !developerDetails && selectedEntry && selectedId
        ? detectSimpleRouterMode(selectedEntry, selectedId, indexEntries)
        : null,
    [developerDetails, indexEntries, selectedEntry, selectedId],
  );

  const taskRouter = useSimpleTaskRouter({
    mode: simpleRouterMode,
    entry: selectedEntry,
    indexEntries,
    selectedId: selectedId ?? "",
    onSelectId: onSelectIndexedId,
  });

  const panelControls = taskRouter.active ? taskRouter.controls : null;

  const humanPreviewBlock = useMemo(() => {
    if (developerDetails) {
      return null;
    }
    return formatHumanPreviewBlock(
      buildHumanPreviewLines({ baselineText, draftText, baselinePicks, draftPicks: picks }),
    );
  }, [baselinePicks, baselineText, developerDetails, draftText, picks]);

  const previewButtonLabel = NUVO_VALIDATE_CHANGES_LABEL;
  const applyButtonLabel = NUVO_APPLY_TO_CODE_LABEL;
  const simpleMode = !developerDetails;
  const selectionTitle =
    selectedId && selectedEntry
      ? formatSelectionTitle(selectedId, selectedEntry, indexEntries)
      : null;

  const selectionBrandCategory = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }
    return resolveBrandCategoryForEntry(selectedEntry);
  }, [selectedEntry]);
  const showEditSection =
    selectedId &&
    !missing &&
    (developerDetails || !taskRouter.active || taskRouter.showTaskControls);
  const showSimpleEditControls =
    simpleMode && selectedId && !missing && (!taskRouter.active || taskRouter.showTaskControls);
  const showQuickStyle =
    showSimpleEditControls && (!panelControls || panelControls.showText);
  const tableAtRootMenu =
    taskRouter.active &&
    simpleRouterMode === "table" &&
    taskRouter.tableTask === "menu" &&
    !taskRouter.isDirectTableFieldEdit;

  const textTargets = selectedEntry?.textTargets ?? [];

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const activeTextTarget = useMemo((): TextWireTarget | undefined => {
    if (!activeTextTargetKey) {
      return undefined;
    }
    return textTargets.find((t) => t.key === activeTextTargetKey);
  }, [textTargets, activeTextTargetKey]);

  const patchTextId = useMemo((): string | null => {
    if (!selectedId) {
      return null;
    }
    if (activeTextTarget?.nuvioId) {
      return activeTextTarget.nuvioId;
    }
    if (selectedEntry?.textEditable) {
      return selectedId;
    }
    return null;
  }, [activeTextTarget, selectedEntry?.textEditable, selectedId]);

  const containerStyleId = useMemo((): string | null => {
    if (!selectedId) {
      return null;
    }
    return selectedEntry?.patchHostId ?? selectedId;
  }, [selectedEntry?.patchHostId, selectedId]);

  const textStyleId = useMemo((): string | null => {
    if (!selectedId) {
      return null;
    }
    return activeTextTarget?.patchHostId ?? activeTextTarget?.nuvioId ?? null;
  }, [activeTextTarget, selectedId]);

  const hasStyleTargetChoice =
    Boolean(containerStyleId) && Boolean(textStyleId) && containerStyleId !== textStyleId;

  useEffect(() => {
    if (!selectedId) {
      setStyleTargetMode("container");
      return;
    }
    if (hasStyleTargetChoice) {
      setStyleTargetMode("container");
      return;
    }
    if (textStyleId) {
      setStyleTargetMode("text");
      return;
    }
    setStyleTargetMode("container");
  }, [selectedId, hasStyleTargetChoice, textStyleId]);

  const patchStyleId = useMemo((): string | null => {
    if (!selectedId) {
      return null;
    }
    if (styleTargetMode === "text" && textStyleId) {
      return textStyleId;
    }
    return containerStyleId ?? textStyleId ?? selectedId;
  }, [containerStyleId, selectedId, styleTargetMode, textStyleId]);

  const [styleHostClassName, setStyleHostClassName] = useState("");

  useEffect(() => {
    if (!selectedId) {
      setStyleHostClassName("");
      return;
    }
    const styleId = patchStyleId ?? selectedId;
    const el = document.querySelector(`[data-nuvio-id="${escapeAttrSelector(styleId)}"]`);
    setStyleHostClassName(el instanceof HTMLElement ? el.className : "");
  }, [selectedId, patchStyleId, stagedVersion]);

  const showResponsiveDeviceControls = useMemo(
    () => classNameHasResponsiveUtilities(styleHostClassName),
    [styleHostClassName],
  );

  useEffect(() => {
    if (!selectedId) {
      setMissing(false);
      return;
    }
    const el = document.querySelector(`[data-nuvio-id="${escapeAttrSelector(selectedId)}"]`);
    setMissing(!(el instanceof HTMLElement));
  }, [selectedId]);

  const syncFromActiveTarget = useCallback((): void => {
    const hostId = selectedIdRef.current;
    if (!hostId) {
      return;
    }
    const textEl =
      activeTextTarget && textTargets.length > 0
        ? resolveTextTargetElement(hostId, activeTextTarget)
        : document.querySelector(`[data-nuvio-id="${escapeAttrSelector(hostId)}"]`);
    const hostEl = document.querySelector(`[data-nuvio-id="${escapeAttrSelector(hostId)}"]`);
    const styleEl =
      patchStyleId && hostEl instanceof HTMLElement
        ? (hostEl.querySelector(`[data-nuvio-id="${escapeAttrSelector(patchStyleId)}"]`) ??
          document.querySelector(`[data-nuvio-id="${escapeAttrSelector(patchStyleId)}"]`))
        : patchStyleId
          ? document.querySelector(`[data-nuvio-id="${escapeAttrSelector(patchStyleId)}"]`)
          : textEl;

    if (textEl instanceof HTMLElement) {
      const tableField = selectedEntry?.tableDataField;
      if (tableField) {
        const text = textEl.textContent?.trim() ?? "";
        setTextEditable(true);
        setTextEditReason(null);
        setBaselineText(text);
        setDraftText(text);
      } else {
      const { text, textEditable: domEditable, reason } = readEditableTextFromElement(textEl);
      const indexAllowsText = activeTextTarget
        ? activeTextTarget.textEditable
        : selectedEntry?.textEditable !== false;
      setTextEditable(domEditable && indexAllowsText);
      setTextEditReason(
        activeTextTarget && !activeTextTarget.textEditable
          ? "This text cannot be edited safely."
          : !domEditable
            ? (reason ?? null)
            : null,
      );
      setBaselineText(text);
      setDraftText(text);
      }
    } else {
      setTextEditable(false);
      setTextEditReason("Could not find this text on the page — try selecting it again.");
      setBaselineText("");
      setDraftText("");
    }

    if (styleEl instanceof HTMLElement) {
      const fromClass = readAlphaPicksFromElement(styleEl, activeBreakpoint);
      setBaselinePicks(fromClass);
      setPicks(fromClass);
    } else {
      setBaselinePicks(EMPTY_ALPHA_PICKS);
      setPicks(EMPTY_ALPHA_PICKS);
    }
  }, [
    activeBreakpoint,
    activeTextTarget,
    patchStyleId,
    selectedEntry?.tableDataField,
    selectedEntry?.textEditable,
    textTargets.length,
  ]);

  const displayPreviewError = developerDetails
    ? formatPatchUserMessage(previewError)
    : formatPatchUserMessagePlain(previewError);

  useEffect(() => {
    if (!selectedId) {
      setDraftText("");
      setBaselineText("");
      setBaselinePicks(EMPTY_ALPHA_PICKS);
      setPicks(EMPTY_ALPHA_PICKS);
      setTextEditable(true);
      setTextEditReason(null);
      return;
    }
    syncFromActiveTarget();
  }, [selectedId, activeTextTargetKey, activeBreakpoint, syncFromActiveTarget]);

  /** After Apply/Undo, Vite HMR may update the DOM a tick later; resync draft from the live node. */
  useEffect(() => {
    if (stagedVersion === 0) {
      return;
    }
    if (!selectedIdRef.current) {
      return;
    }
    const t = window.setTimeout(syncFromActiveTarget, 280);
    return () => window.clearTimeout(t);
  }, [stagedVersion, syncFromActiveTarget]);

  const patchIdBlockedMessage = useCallback(
    (id: string): string | null => {
      if (isDuplicateIndexedId(id, duplicateErrors)) {
        return developerDetails
          ? `Id "${id}" is duplicated in the project and was removed from the dev index. Use a unique data-nuvio-id per element.`
          : getSimpleDuplicateIdPatchMessage(id);
      }
      if (!knownIds.has(id)) {
        return developerDetails
          ? `Id "${id}" is not in the dev source index — restart dev server or fix instrumentation.`
          : "This part of the page isn't set up to save yet. Pick another element or fix duplicate names.";
      }
      return null;
    },
    [developerDetails, duplicateErrors, knownIds],
  );

  const resolvePatchApplyId = useCallback((): { id: string } | { error: string } => {
    if (!selectedId) {
      return { error: "Nothing is selected." };
    }
    const hasText = textEditable && draftText !== baselineText;
    const styleOps = buildAlphaPatchOps(baselineText, draftText, baselinePicks, picks, {
      textEditable: false,
      priorDraftPicks: priorPicks,
    });
    const hasStyle = styleOps.length > 0;
    if (!hasText && !hasStyle) {
      return { error: "No changes to apply." };
    }
    if (hasText && !patchTextId) {
      return {
        error: developerDetails
          ? "Text cannot be patched for this target — add a data-nuvio-id on the text element."
          : "nuvio can't safely edit this text yet.",
      };
    }
    if (hasStyle && !patchStyleId) {
      return {
        error: developerDetails
          ? "Styles cannot be patched for this target."
          : "nuvio can't safely edit this area yet.",
      };
    }
    if (hasText && patchTextId) {
      const blocked = patchIdBlockedMessage(patchTextId);
      if (blocked) {
        return { error: blocked };
      }
    }
    if (hasStyle && patchStyleId) {
      const blocked = patchIdBlockedMessage(patchStyleId);
      if (blocked) {
        return { error: blocked };
      }
    }
    if (hasText && hasStyle && patchTextId !== patchStyleId) {
      return {
        error: developerDetails
          ? "Text and styles target different elements. Validate and apply text first, then edit styles (or pick a single element in Edit target)."
          : "Text and styles apply to different parts. Validate text first, then change styles.",
      };
    }
    const id = hasText ? patchTextId! : patchStyleId!;
    return { id };
  }, [
    baselinePicks,
    baselineText,
    developerDetails,
    draftText,
    patchIdBlockedMessage,
    patchStyleId,
    patchTextId,
    picks,
    selectedId,
    textEditable,
  ]);

  const stagedOps = useMemo((): PatchOp[] => {
    const styleOps = buildAlphaPatchOps(baselineText, draftText, baselinePicks, picks, {
      textEditable: false,
      priorDraftPicks: priorPicks,
    });
    const binding = selectedEntry?.tableDataField;
    if (binding && textEditable && draftText !== baselineText) {
      return [
        {
          kind: "setTableDataField",
          arrayName: binding.arrayName,
          rowKey: binding.rowKey,
          field: binding.field,
          value: draftText,
        },
        ...styleOps,
      ];
    }
    return buildAlphaPatchOps(baselineText, draftText, baselinePicks, picks, {
      textEditable,
      priorDraftPicks: priorPicks,
    });
  }, [
    baselineText,
    draftText,
    baselinePicks,
    picks,
    priorPicks,
    selectedEntry?.tableDataField,
    textEditable,
  ]);

  const stagedOpsFingerprint = useMemo(() => JSON.stringify(stagedOps), [stagedOps]);

  useEffect(() => {
    setPatchTargetError(null);
    lastAutoValidatedFpRef.current = null;
  }, [selectedId, activeTextTargetKey, stagedOpsFingerprint]);

  useEffect(() => {
    return () => {
      if (autoValidateTimerRef.current != null) {
        window.clearTimeout(autoValidateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    onStagedPatchFingerprint(stagedOpsFingerprint);
  }, [selectedId, stagedOpsFingerprint, onStagedPatchFingerprint]);

  const hasTextChange = textEditable && draftText !== baselineText;
  const hasStagedOps = stagedOps.length > 0;
  const selectionResolved = Boolean(resolvedFile);

  const containerGuidanceVisible = Boolean(
    selectedEntry &&
      selectedId &&
      !missing &&
      selectedEntry.textEditable === false &&
      textTargets.length > 0,
  );

  const contextualGuideId = useMemo(
    () =>
      pickContextualGuide({
        developerDetails,
        selectedId,
        selectedEntry,
        selectionResolved,
        dismissed: dismissedGuides,
        containerGuidanceVisible,
        tableAtRootMenu,
        taskRouterShowControls: taskRouter.showTaskControls,
      }),
    [
      developerDetails,
      dismissedGuides,
      missing,
      selectedEntry,
      selectedId,
      selectionResolved,
      containerGuidanceVisible,
      textTargets.length,
      tableAtRootMenu,
      taskRouter.showTaskControls,
    ],
  );

  const showWelcome = shouldShowWelcome({ developerDetails, dismissed: dismissedGuides });
  const patchBlockedReason =
    indexIdCount === 0
      ? "Source index has 0 ids — the dev server cannot map data-nuvio-id to files. Run pnpm dev from the repo root (builds packages), then hard-refresh. Check the terminal for [nuvio] index warnings."
      : selectedId && !selectionResolved
        ? selectError ??
          "Server did not confirm this id (no source file). Patches stay disabled until selection succeeds."
        : null;

  const displayPatchBlockedReason = developerDetails
    ? patchBlockedReason
    : getSimplePatchBlockedMessage(indexIdCount, selectionResolved) ??
      (selectError ? getSimpleSelectErrorMessage(selectError) : null);
  const previewApplyMismatch =
    hasStagedOps &&
    selectionResolved &&
    channelReady &&
    indexIdCount > 0 &&
    (!previewSummary ||
      previewError != null ||
      previewValidatedFingerprint !== stagedOpsFingerprint);
  const patchTargetConflict =
    textEditable &&
    draftText !== baselineText &&
    alphaPicksDiffer(picks, baselinePicks) &&
    patchTextId != null &&
    patchStyleId != null &&
    patchTextId !== patchStyleId;

  const patchActionsDisabled =
    !channelReady ||
    !hasStagedOps ||
    indexIdCount === 0 ||
    !selectionResolved ||
    patchTargetConflict;

  useEffect(() => {
    if (autoValidateTimerRef.current != null) {
      window.clearTimeout(autoValidateTimerRef.current);
      autoValidateTimerRef.current = null;
    }
    // Debounce style-only validate for slider/color/select changes.
    if (
      !selectedId ||
      stagedOps.length === 0 ||
      hasTextChange ||
      patchActionsDisabled ||
      previewOrigin === "brand"
    ) {
      return;
    }
    if (lastAutoValidatedFpRef.current === stagedOpsFingerprint) {
      return;
    }
    autoValidateTimerRef.current = window.setTimeout(() => {
      const resolved = resolvePatchApplyId();
      if ("error" in resolved) {
        return;
      }
      lastAutoValidatedFpRef.current = stagedOpsFingerprint;
      onRequestPreview(stagedOps, resolved.id);
    }, 300);
  }, [
    hasStagedOps,
    hasTextChange,
    onRequestPreview,
    patchActionsDisabled,
    resolvePatchApplyId,
    selectedId,
    stagedOps,
    stagedOpsFingerprint,
    previewOrigin,
  ]);
  useEffect(() => {
    if (previewOrigin !== "brand") {
      prevStagedFpForBrandRef.current = stagedOpsFingerprint;
      return;
    }
    if (
      prevStagedFpForBrandRef.current != null &&
      prevStagedFpForBrandRef.current !== stagedOpsFingerprint
    ) {
      onCancelPreview();
      setBrandPreviewClearedNotice("Manual edits changed — validate brand style again if needed.");
    }
    prevStagedFpForBrandRef.current = stagedOpsFingerprint;
  }, [onCancelPreview, previewOrigin, stagedOpsFingerprint]);

  useEffect(() => {
    if (previewOrigin === "brand") {
      setBrandPreviewClearedNotice(null);
    }
  }, [previewOrigin, previewValidatedFingerprint]);

  /** Structural ops (move/hide/duplicate) do not require style/text staging. */
  const structuralActionsDisabled =
    !channelReady ||
    indexIdCount === 0 ||
    !selectedId ||
    !selectionResolved ||
    missing;
  const applyReady =
    channelReady &&
    indexIdCount > 0 &&
    selectionResolved &&
    previewValidatedOps != null &&
    previewValidatedOps.length > 0 &&
    previewValidatedFingerprint != null &&
    !previewError &&
    !previewBusy;
  const applyDisabled = !applyReady && !brandBulkApplyReady;
  const brandApplyReady =
    brandBulkApplyReady ||
    (previewOrigin === "brand" &&
      applyReady &&
      previewValidatedOps != null &&
      previewValidatedOps.length > 0);
  const previewReady =
    hasStagedOps &&
    previewValidatedFingerprint === stagedOpsFingerprint &&
    !previewError &&
    !previewBusy &&
    previewValidatedOps != null &&
    previewValidatedOps.length > 0;
  const [siblingMove, setSiblingMove] = useState(() => ({
    canMoveUp: false,
    canMoveDown: false,
    peerCount: 0,
  }));

  useLayoutEffect(() => {
    if (!selectedId || missing) {
      setSiblingMove({ canMoveUp: false, canMoveDown: false, peerCount: 0 });
      return;
    }
    setSiblingMove(getIndexedSiblingMoveAvailability(selectedId));
  }, [selectedId, missing, stagedVersion]);

  const structuralPreviewMessage = structuralPreviewActive ? displayPreviewError : null;
  const structuralPreviewOk =
    structuralPreviewActive && !previewError && previewSummary ? previewSummary : null;

  const fontSizeOpts = [
    { value: "", label: "—" },
    { value: "text-sm", label: "text-sm" },
    { value: "text-base", label: "text-base" },
    { value: "text-lg", label: "text-lg" },
    { value: "text-xl", label: "text-xl" },
    { value: "text-2xl", label: "text-2xl" },
  ];
  const fontWeightOpts = [
    { value: "", label: "—" },
    { value: "font-medium", label: "font-medium" },
    { value: "font-semibold", label: "font-semibold" },
    { value: "font-bold", label: "font-bold" },
  ];
  const lineHeightOpts = [
    { value: "", label: "—" },
    { value: "leading-tight", label: "leading-tight" },
    { value: "leading-snug", label: "leading-snug" },
    { value: "leading-normal", label: "leading-normal" },
    { value: "leading-relaxed", label: "leading-relaxed" },
  ];
  const letterSpacingOpts = [
    { value: "", label: "—" },
    { value: "tracking-tight", label: "tracking-tight" },
    { value: "tracking-normal", label: "tracking-normal" },
    { value: "tracking-wide", label: "tracking-wide" },
  ];
  const roundedOpts = [
    { value: "", label: "—" },
    { value: "rounded-md", label: "rounded-md" },
    { value: "rounded-lg", label: "rounded-lg" },
    { value: "rounded-xl", label: "rounded-xl" },
    { value: "rounded-full", label: "rounded-full" },
  ];
  const padOpts = [
    { value: "", label: "—" },
    { value: "p-2", label: "p-2" },
    { value: "p-4", label: "p-4" },
    { value: "p-6", label: "p-6" },
    { value: "px-4 py-2", label: "px-4 py-2" },
  ];
  const marginOpts = [
    { value: "", label: "—" },
    { value: "m-2", label: "m-2" },
    { value: "m-4", label: "m-4" },
    { value: "mx-auto", label: "mx-auto" },
    { value: "mt-4", label: "mt-4" },
    { value: "mb-4", label: "mb-4" },
  ];
  const padXOpts = [
    { value: "", label: "—" },
    { value: "px-2", label: "px-2" },
    { value: "px-4", label: "px-4" },
    { value: "px-6", label: "px-6" },
    { value: "px-8", label: "px-8" },
  ];
  const padYOpts = [
    { value: "", label: "—" },
    { value: "py-1", label: "py-1" },
    { value: "py-2", label: "py-2" },
    { value: "py-4", label: "py-4" },
    { value: "py-6", label: "py-6" },
  ];
  const marginXOpts = [
    { value: "", label: "—" },
    { value: "mx-2", label: "mx-2" },
    { value: "mx-4", label: "mx-4" },
    { value: "mx-6", label: "mx-6" },
    { value: "mx-auto", label: "mx-auto" },
  ];
  const marginYOpts = [
    { value: "", label: "—" },
    { value: "my-1", label: "my-1" },
    { value: "my-2", label: "my-2" },
    { value: "my-4", label: "my-4" },
    { value: "my-6", label: "my-6" },
  ];
  const textAlignOpts = [
    { value: "", label: "—" },
    { value: "text-left", label: "text-left" },
    { value: "text-center", label: "text-center" },
    { value: "text-right", label: "text-right" },
    { value: "text-justify", label: "text-justify" },
  ];
  const gapOpts = [
    { value: "", label: "—" },
    { value: "gap-1", label: "gap-1" },
    { value: "gap-2", label: "gap-2" },
    { value: "gap-4", label: "gap-4" },
    { value: "gap-6", label: "gap-6" },
    { value: "gap-8", label: "gap-8" },
  ];
  const flexDirectionOpts = [
    { value: "", label: "—" },
    { value: "flex-row", label: "flex-row" },
    { value: "flex-col", label: "flex-col" },
  ];
  const justifyOpts = [
    { value: "", label: "—" },
    { value: "justify-start", label: "justify-start" },
    { value: "justify-center", label: "justify-center" },
    { value: "justify-end", label: "justify-end" },
    { value: "justify-between", label: "justify-between" },
    { value: "justify-around", label: "justify-around" },
  ];
  const itemsOpts = [
    { value: "", label: "—" },
    { value: "items-start", label: "items-start" },
    { value: "items-center", label: "items-center" },
    { value: "items-end", label: "items-end" },
    { value: "items-stretch", label: "items-stretch" },
  ];
  const gridColsOpts = [
    { value: "", label: "—" },
    { value: "grid-cols-1", label: "grid-cols-1" },
    { value: "grid-cols-2", label: "grid-cols-2" },
    { value: "grid-cols-3", label: "grid-cols-3" },
    { value: "grid-cols-4", label: "grid-cols-4" },
    { value: "grid-cols-6", label: "grid-cols-6" },
    { value: "grid-cols-12", label: "grid-cols-12" },
  ];
  const widthOpts = [
    { value: "", label: "—" },
    { value: "w-auto", label: "w-auto" },
    { value: "w-full", label: "w-full" },
    { value: "w-1/2", label: "w-1/2" },
    { value: "w-1/3", label: "w-1/3" },
    { value: "w-2/3", label: "w-2/3" },
    { value: "w-1/4", label: "w-1/4" },
    { value: "w-3/4", label: "w-3/4" },
  ];
  const maxWidthOpts = [
    { value: "", label: "—" },
    { value: "max-w-sm", label: "max-w-sm" },
    { value: "max-w-md", label: "max-w-md" },
    { value: "max-w-lg", label: "max-w-lg" },
    { value: "max-w-xl", label: "max-w-xl" },
    { value: "max-w-2xl", label: "max-w-2xl" },
    { value: "max-w-4xl", label: "max-w-4xl" },
    { value: "max-w-prose", label: "max-w-prose" },
    { value: "max-w-full", label: "max-w-full" },
  ];
  const heightOpts = [
    { value: "", label: "—" },
    { value: "h-auto", label: "h-auto" },
    { value: "h-full", label: "h-full" },
    { value: "h-8", label: "h-8" },
    { value: "h-12", label: "h-12" },
    { value: "h-16", label: "h-16" },
    { value: "h-24", label: "h-24" },
    { value: "h-screen", label: "h-screen" },
  ];
  const minHeightOpts = [
    { value: "", label: "—" },
    { value: "min-h-0", label: "min-h-0" },
    { value: "min-h-full", label: "min-h-full" },
    { value: "min-h-screen", label: "min-h-screen" },
    { value: "min-h-16", label: "min-h-16" },
    { value: "min-h-24", label: "min-h-24" },
  ];
  const opacityOpts = [
    { value: "", label: "—" },
    { value: "opacity-0", label: "opacity-0" },
    { value: "opacity-25", label: "opacity-25" },
    { value: "opacity-50", label: "opacity-50" },
    { value: "opacity-75", label: "opacity-75" },
    { value: "opacity-100", label: "opacity-100" },
  ];
  const shadowOpts = [
    { value: "", label: "—" },
    { value: "shadow-none", label: "shadow-none" },
    { value: "shadow-sm", label: "shadow-sm" },
    { value: "shadow", label: "shadow" },
    { value: "shadow-md", label: "shadow-md" },
    { value: "shadow-lg", label: "shadow-lg" },
    { value: "shadow-xl", label: "shadow-xl" },
  ];
  const borderWidthOpts = [
    { value: "", label: "—" },
    { value: "border", label: "border" },
    { value: "border-0", label: "border-0" },
    { value: "border-2", label: "border-2" },
    { value: "border-4", label: "border-4" },
  ];
  const borderColorOpts = [
    { value: "", label: "—" },
    { value: "border-slate-200", label: "border-slate-200" },
    { value: "border-slate-400", label: "border-slate-400" },
    { value: "border-slate-700", label: "border-slate-700" },
    { value: "border-slate-800", label: "border-slate-800" },
    { value: "border-sky-500", label: "border-sky-500" },
    { value: "border-white", label: "border-white" },
  ];
  const ringWidthOpts = [
    { value: "", label: "—" },
    { value: "ring", label: "ring" },
    { value: "ring-0", label: "ring-0" },
    { value: "ring-1", label: "ring-1" },
    { value: "ring-2", label: "ring-2" },
    { value: "ring-4", label: "ring-4" },
  ];
  const ringColorOpts = [
    { value: "", label: "—" },
    { value: "ring-slate-400", label: "ring-slate-400" },
    { value: "ring-sky-500", label: "ring-sky-500" },
    { value: "ring-emerald-500", label: "ring-emerald-500" },
    { value: "ring-white", label: "ring-white" },
  ];

  if (panelCollapsed) {
    return (
      <button
        type="button"
        ref={(el) => setShellElement(el)}
        className={`${NUVO_ROOT} nuvio-panel-tab ${NUVO_GLASS_SHELL} ${
          displayPanelPosition
            ? ""
            : tabOnRight
              ? "nuvio-panel-tab--right"
              : "nuvio-panel-tab--left"
        }`}
        style={{
          ...NUVO_GLASS_SHELL_INLINE,
          ...(displayPanelPosition
            ? {
                left: tabOnRight ? undefined : displayPanelPosition.x,
                right: tabOnRight
                  ? window.innerWidth - displayPanelPosition.x - 40
                  : undefined,
                top: displayPanelPosition.y,
                transform: "none",
              }
            : {}),
        }}
        title="Expand Editor panel"
        onClick={() => onPanelCollapsedChange(false)}
      >
        <span className={tabOnRight ? "" : "nuvio-flip-x"} aria-hidden="true">
          ›
        </span>
        <span className="nuvio-sr-only">Expand Editor</span>
      </button>
    );
  }

  const docked = displayPanelPosition === null;
  const panelStyle: CSSProperties | undefined = docked
    ? undefined
    : {
        left: displayPanelPosition.x,
        top: displayPanelPosition.y,
        maxHeight: "calc(100vh - 48px)",
      };

  return (
    <aside
      ref={setShellElement}
      style={{ ...NUVO_GLASS_SHELL_INLINE, ...panelStyle }}
      className={`${NUVO_ROOT} nuvio-panel ${NUVO_GLASS_SHELL} ${docked ? "nuvio-panel--docked" : ""} ${
        panelDragging ? "nuvio-panel--dragging" : ""
      }`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className={NUVO_GLASS_CONTENT}>
        <header
          className={`nuvio-panel-header ${
            panelDragging ? "nuvio-panel-header--grabbing" : ""
          }`}
          onPointerDown={onHeaderPointerDown}
        >
          <span className="nuvio-panel-header-title">Editor</span>
          <button
            type="button"
            className={`nuvio-toggle-details ${developerDetails ? "nuvio-toggle-details--on" : ""}`}
            title="Show file paths, risk level, and technical diagnostics"
            aria-label="Developer details"
            aria-pressed={developerDetails}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDeveloperDetailsChange(!developerDetails)}
          >
            Developer details
          </button>
          <button
            type="button"
            className="nuvio-button-icon"
            title="Reset panel position"
            aria-label="Reset panel position"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onResetPanelPosition()}
          >
            Reset
          </button>
          <button
            type="button"
            className="nuvio-button-icon"
            title="Collapse panel"
            aria-label="Collapse Editor panel"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onPanelCollapsedChange(true)}
          >
            −
          </button>
        </header>
        {developerDetails ? <EditorStackVersions diagnostics={runtimeDiagnostics} /> : null}
        <EditorPanelTabs
          active={editorTab}
          onChange={(tab) => {
            if (editorTab === "brand" && tab !== "brand") {
              onRevertBrandPagePreview();
            }
            setEditorTab(tab);
            if (tab === "brand") {
              captureBrandKitOpened();
            }
          }}
        />
        <div className="nuvio-panel-body">
          {showWelcome && editorTab === "edit" ? (
            <OnboardingGuide
              guideId="welcome"
              variant="welcome"
              onDismiss={() => dismissOnboardingGuide("welcome")}
            />
          ) : null}
          {editorTab !== "brand" || (selectedId && !missing) ? (
            <div className="nuvio-selection-strip">
              {editorTab === "brand" ? (
                developerDetails ? (
                  <>
                    <span className="nuvio-brand-selection-label">
                      {selectionBrandCategory
                        ? `${BRAND_CATEGORY_STRIP_LABELS[selectionBrandCategory]} ·`
                        : "Inspecting"}
                    </span>
                    <span className="nuvio-selection-strip-id">{selectedId}</span>
                    {resolvedFile ? (
                      <span className="nuvio-selection-strip-path">
                        {resolvedFile}
                        {resolvedLine != null ? `:${resolvedLine}` : ""}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="nuvio-brand-selection-label">
                      {selectionBrandCategory
                        ? `${BRAND_CATEGORY_STRIP_LABELS[selectionBrandCategory]} ·`
                        : "Inspecting"}
                    </span>
                    <span className="nuvio-selection-strip-id nuvio-selection-strip-id--friendly">
                      {selectionTitle}
                    </span>
                  </>
                )
              ) : selectedId ? (
                developerDetails ? (
                  <>
                    <span className="nuvio-selection-strip-id">{selectedId}</span>
                    {resolvedFile ? (
                      <span className="nuvio-selection-strip-path">
                        {resolvedFile}
                        {resolvedLine != null ? `:${resolvedLine}` : ""}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="nuvio-selection-strip-id nuvio-selection-strip-id--friendly">
                      {selectionTitle}
                    </span>
                    {taskRouter.backNav ? (
                      <button
                        type="button"
                        className="nuvio-back-link"
                        onClick={taskRouter.backNav.onBack}
                      >
                        {taskRouter.backNav.label}
                      </button>
                    ) : null}
                  </>
                )
              ) : (
                <span className="nuvio-text-muted">Click something on the page to edit it.</span>
              )}
            </div>
          ) : null}
        {indexIdCount === 0 ? (
          <p className="nuvio-text-xs nuvio-text-warn">
            {developerDetails ? "Index empty — restart dev server." : getSimpleIndexEmptyMessage()}
          </p>
        ) : null}
        {developerDetails && selectedId && !resolvedFile && selectError ? (
          <p className="nuvio-text-xs nuvio-text-error">{selectError}</p>
        ) : null}
        {!developerDetails && selectedId && !resolvedFile && selectError ? (
          <p className="nuvio-text-xs nuvio-text-error">{getSimpleSelectErrorMessage(selectError)}</p>
        ) : null}

        {editorTab === "brand" ? (
          <>
            <BrandKitPanel
              channelReady={channelReady}
              selectedId={selectedId}
              selectedEntry={selectedEntry}
              selectionMissing={Boolean(selectedId && missing)}
              styleHostId={patchStyleId ?? selectedId}
              developerDetails={developerDetails}
              embeddedInTab
              activeBreakpoint={activeBreakpoint}
              styleResyncVersion={stagedVersion}
              indexEntries={indexEntries}
              knownIds={knownIds}
              duplicateErrors={duplicateErrors}
              brandBulkProgress={brandBulkProgress}
              brandBulkAppliedByAction={brandBulkAppliedByAction}
              brandBulkApplyReady={brandBulkApplyReady}
              brandBulkValidatedAction={brandBulkValidatedAction}
              brandBulkValidatedConfig={brandBulkValidatedConfig}
              onRequestBrandBulkPreview={onRequestBrandBulkPreview}
              onRequestBrandBulkApply={onRequestBrandBulkApply}
              onBrandRouteChange={onBrandRouteChange}
              onBrandSaved={onBrandSaved}
              onBrandDraftChange={onBrandDraftChange}
            />
            {brandPreviewClearedNotice ? (
              <p className="nuvio-text-2xs nuvio-text-warn">{brandPreviewClearedNotice}</p>
            ) : null}
          </>
        ) : (
          <>
        {selectedEntry ? (
          developerDetails ? (
            <SelectionMetadata entry={selectedEntry} />
          ) : !taskRouter.active && !simpleRouterMode ? (
            <SelectionSummary entry={selectedEntry} />
          ) : null
        ) : null}

        {taskRouter.active ? taskRouter.cardMenu : null}
        {taskRouter.active ? taskRouter.tableMenu : null}
        {taskRouter.active ? taskRouter.buttonMenu : null}
        {taskRouter.active ? taskRouter.formMenu : null}
        {taskRouter.active ? taskRouter.navMenu : null}
        {taskRouter.active ? taskRouter.chartMenu : null}
        {taskRouter.active ? taskRouter.sectionMenu : null}

        {taskRouter.active &&
        simpleRouterMode === "nav" &&
        taskRouter.navTask === "navigationItems" &&
        taskRouter.navTargets.length > 0 ? (
          <section className="nuvio-card nuvio-stack-2">
            <p className="nuvio-label">Pick a link</p>
            <div className="nuvio-stack-1">
              {taskRouter.navTargets.map((navEntry) => (
                <button
                  key={navEntry.id}
                  type="button"
                  className={`nuvio-button nuvio-button--block ${selectedId === navEntry.id ? "nuvio-button-primary" : ""}`}
                  onClick={() => onSelectIndexedId(navEntry.id)}
                >
                  {formatFriendlyId(navEntry.id, navEntry)}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {taskRouter.active &&
        simpleRouterMode === "table" &&
        taskRouter.tableTask === "columnHeaders" &&
        !taskRouter.isDirectTableFieldEdit ? (
          <TableColumnHeaderPicker
            headers={taskRouter.tableHeaders}
            selectedId={selectedId ?? ""}
            developerDetails={developerDetails}
            onSelectId={onSelectIndexedId}
          />
        ) : null}

        {taskRouter.active &&
        simpleRouterMode === "table" &&
        taskRouter.tableTask === "rows" &&
        !taskRouter.isDirectTableFieldEdit ? (
          <TableRowPicker
            rows={taskRouter.tableRows}
            selectedId={selectedId ?? ""}
            onSelectId={(rowId) => {
              const nameTextId = indexEntries.find((e) => e.id === `${rowId}.nameText`)?.id;
              onSelectIndexedId(nameTextId ?? rowId);
            }}
          />
        ) : null}

        {contextualGuideId ? (
          <OnboardingGuide
            guideId={contextualGuideId}
            variant="contextual"
            onDismiss={() => dismissOnboardingGuide(contextualGuideId)}
          />
        ) : null}

        {developerDetails && selectedId && textTargets.length > 1 && activeTextTargetKey ? (
          <TextTargetPicker
            hostId={selectedId}
            targets={textTargets}
            activeKey={activeTextTargetKey}
            onActiveKeyChange={onActiveTextTargetKeyChange}
            developerDetails={developerDetails}
            onHoverKeyChange={onHoverTextTargetKeyChange}
          />
        ) : null}

        {selectedEntry && selectedId && !missing ? (
          <ContainerGuidance
            entry={selectedEntry}
            selectedId={selectedId}
            textTargets={textTargets}
            indexEntries={indexEntries}
            developerDetails={developerDetails}
            taskRouterActive={taskRouter.active}
            onSwitchToTarget={({ nuvioId, key }) => {
              if (nuvioId) {
                onSelectIndexedId(nuvioId);
              } else {
                onActiveTextTargetKeyChange(key);
              }
            }}
            onSelectId={onSelectIndexedId}
            onCopyFixPrompt={() => {
              void copyTextToClipboard(MAKE_TABLE_EDITABLE_SNIPPET);
            }}
          />
        ) : null}

        {selectedEntry && selectedId && !missing && developerDetails && !taskRouter.active ? (
          <ComponentModePanel
            entry={selectedEntry}
            indexEntries={indexEntries}
            selectedId={selectedId}
            developerDetails={developerDetails}
            onSelectId={onSelectIndexedId}
          />
        ) : null}

        {selectedId && missing ? (
          <p className="nuvio-text-xs nuvio-text-warn">
            {developerDetails ? (
              <>
                No matching <span className="nuvio-text-mono">data-nuvio-id</span> node in the
                document.
              </>
            ) : (
              "This element isn't on the page anymore. Click it again or pick another."
            )}
          </p>
        ) : null}

        {developerDetails && selectedId && !missing ? (
          <section className="nuvio-card nuvio-stack-2">
            <h3 className="nuvio-section-title">Structure</h3>
            {previewBusy && structuralPreviewActive ? (
              <p className="nuvio-text-2xs nuvio-text-accent">Updating layout…</p>
            ) : null}
            {structuralPreviewMessage ? (
              <p className="nuvio-banner nuvio-banner--error">{structuralPreviewMessage}</p>
            ) : null}
            {structuralPreviewOk ? (
              <p className="nuvio-banner nuvio-banner--success nuvio-banner--success-mono">
                {structuralPreviewOk}
              </p>
            ) : null}
            <div className="nuvio-row-wrap">
              <button
                type="button"
                disabled={structuralActionsDisabled || !siblingMove.canMoveUp}
                title={
                  siblingMove.canMoveUp
                    ? "Move earlier in source / left in row"
                    : "Already first in this row"
                }
                className="nuvio-button"
                onClick={() => onRequestStructuralPreview(buildMoveSiblingOp("up"))}
              >
                Move up
              </button>
              <button
                type="button"
                disabled={structuralActionsDisabled || !siblingMove.canMoveDown}
                title={
                  siblingMove.canMoveDown
                    ? "Move later in source / right in row"
                    : "Already last in this row"
                }
                className="nuvio-button"
                onClick={() => onRequestStructuralPreview(buildMoveSiblingOp("down"))}
              >
                Move down
              </button>
              <button
                type="button"
                disabled={structuralActionsDisabled}
                className="nuvio-button"
                onClick={() => onRequestStructuralPreview(buildHideOp())}
              >
                Hide
              </button>
              <button
                type="button"
                disabled={structuralActionsDisabled}
                className="nuvio-button"
                onClick={() => onRequestStructuralPreview(buildShowOp())}
              >
                Show
              </button>
            </div>
          </section>
        ) : null}

        {showEditSection && (developerDetails || showSimpleEditControls) ? (
          <section className="nuvio-card nuvio-stack-2">
            {developerDetails ? (
              <h3 className="nuvio-section-title">Quick edits</h3>
            ) : null}
            {hasStyleTargetChoice && developerDetails ? (
              <label className="nuvio-block nuvio-stack-1">
                <span className="nuvio-label">Style target</span>
                <select
                  className="nuvio-control nuvio-select"
                  value={styleTargetMode}
                  onChange={(e) => setStyleTargetMode(e.target.value as StyleTargetMode)}
                >
                  <option value="container">Card/container</option>
                  <option value="text">Text target</option>
                </select>
              </label>
            ) : null}
            {previewBusy ? (
              <p className="nuvio-banner nuvio-banner--info nuvio-text-2xs">
                {developerDetails
                  ? "Validating patch with the dev server…"
                  : "Validating your changes…"}
              </p>
            ) : null}
            {lastPatchError ? (
              <p className="nuvio-banner nuvio-banner--error">
                {developerDetails
                  ? lastPatchError
                  : (formatPatchUserMessagePlain(lastPatchError) ??
                    getSimpleSelectErrorMessage(lastPatchError))}
              </p>
            ) : null}
            {displayPreviewError && !structuralPreviewActive && developerDetails ? (
              <p className="nuvio-banner nuvio-banner--error">{displayPreviewError}</p>
            ) : null}
            {displayPatchBlockedReason && developerDetails ? (
              <p className="nuvio-banner nuvio-banner--warn">{displayPatchBlockedReason}</p>
            ) : null}
            {hasStagedOps && !displayPatchBlockedReason && previewApplyMismatch && developerDetails ? (
              <p className="nuvio-banner nuvio-banner--neutral nuvio-text-2xs nuvio-leading-snug">
                Run <span className="nuvio-font-medium">{previewButtonLabel}</span> after each edit
                so the summary matches what you apply.
              </p>
            ) : null}
            {hasStagedOps && !displayPatchBlockedReason && previewApplyMismatch && simpleMode ? (
              <p className="nuvio-text-2xs nuvio-text-muted">Validate your changes before applying.</p>
            ) : null}
            {patchTargetConflict ? (
              <p className="nuvio-banner nuvio-banner--warn nuvio-text-2xs nuvio-leading-snug">
                {developerDetails
                  ? "Text and styles apply to different elements. Validate text first, then change styles — or pick one target in Edit target."
                  : "Text and styles apply to different parts. Validate text first, then change styles."}
              </p>
            ) : null}
            {patchTargetError ? (
              <p className="nuvio-banner nuvio-banner--error nuvio-text-2xs">
                {developerDetails
                  ? patchTargetError
                  : patchTargetError.startsWith("nuvio can't") ||
                      patchTargetError.startsWith("Nothing") ||
                      patchTargetError.startsWith("No changes") ||
                      patchTargetError.startsWith("Text and styles") ||
                      patchTargetError.startsWith("This part")
                    ? patchTargetError
                    : (getSimpleSelectErrorMessage(patchTargetError) ?? patchTargetError)}
              </p>
            ) : null}
            {patchStyleId && selectedId && patchStyleId !== selectedId && developerDetails ? (
              <p className="nuvio-text-2xs nuvio-text-muted nuvio-leading-snug">
                Styles apply to{" "}
                <span className="nuvio-font-medium">
                  {developerDetails ? patchStyleId : formatFriendlyId(patchStyleId, selectedEntry)}
                </span>
                {developerDetails ? " (not the outer container you clicked)" : ""}.
              </p>
            ) : null}
            {patchTextId && developerDetails ? (
              <p className="nuvio-text-2xs nuvio-text-muted nuvio-leading-snug">
                Text applies to{" "}
                <span className="nuvio-font-medium">
                  {developerDetails ? patchTextId : formatFriendlyId(patchTextId, selectedEntry)}
                </span>
                .
              </p>
            ) : null}
            {developerDetails && !textEditable && textEditReason ? (
              <p className="nuvio-banner nuvio-banner--neutral nuvio-text-2xs">{textEditReason}</p>
            ) : null}
            {(!panelControls || panelControls.showText) && (
            <label className="nuvio-block nuvio-stack-1">
              <span className="nuvio-label">Text</span>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={2}
                disabled={!textEditable}
                className="nuvio-control nuvio-textarea"
              />
            </label>
            )}
            {showQuickStyle ? (
              <div className="nuvio-stack-1">
                <p className="nuvio-label">Quick Style</p>
                <div className="nuvio-row-wrap">
                  {QUICK_TEXT_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="nuvio-button-chip"
                      onClick={() => {
                        if (preset.id === "normal") {
                          setPicks({ ...baselinePicks });
                        } else {
                          setPicks((p) => applyStylePresetToPicks(p, preset.fragment));
                        }
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {(!panelControls || panelControls.showTextColor) && (developerDetails || !showQuickStyle) && (
            <ColorPickerRow
              label="Text color"
              value={picks.textColor}
              onChange={(v) => setPicks((p) => ({ ...p, textColor: v }))}
              options={TEXT_COLOR_OPTIONS}
              utilityPrefix="text"
              simpleMode={!developerDetails}
            />
            )}
            {(!panelControls || panelControls.showBackground) && (
            <ColorPickerRow
              label="Background"
              value={picks.bgColor}
              onChange={(v) => setPicks((p) => ({ ...p, bgColor: v }))}
              options={BACKGROUND_COLOR_OPTIONS}
              utilityPrefix="bg"
              simpleMode={!developerDetails}
            />
            )}
            {(!panelControls || panelControls.showPadding) && (
            <SelectRow
              label="Padding"
              value={picks.padding}
              onChange={(v) => setPicks((p) => ({ ...p, padding: v }))}
              options={padOpts}
              developerDetails={developerDetails}
              simpleCategory="padding"
            />
            )}
            {(!panelControls || panelControls.showRadius) && (
            <SelectRow
              label="Radius"
              value={picks.rounded}
              onChange={(v) => setPicks((p) => ({ ...p, rounded: v }))}
              options={roundedOpts}
              developerDetails={developerDetails}
              simpleCategory="rounded"
            />
            )}
            {(!panelControls || panelControls.showFontSize) && developerDetails && (
            <SelectRow
              label="Size"
              value={picks.fontSize}
              onChange={(v) => setPicks((p) => ({ ...p, fontSize: v }))}
              options={fontSizeOpts}
              developerDetails={developerDetails}
              simpleCategory="fontSize"
            />
            )}
            {(!panelControls || panelControls.showFontWeight) && developerDetails && (
            <SelectRow
              label="Weight"
              value={picks.fontWeight}
              onChange={(v) => setPicks((p) => ({ ...p, fontWeight: v }))}
              options={fontWeightOpts}
              developerDetails={developerDetails}
              simpleCategory="fontWeight"
            />
            )}
            {(!panelControls || panelControls.showWidth) && !developerDetails ? (
            <SelectRow
              label="Width"
              value={picks.width}
              onChange={(v) => setPicks((p) => ({ ...p, width: v }))}
              options={widthOpts}
              developerDetails={developerDetails}
              simpleCategory="width"
            />
            ) : null}
            {(!panelControls || panelControls.showShadow) && !developerDetails && (
            <SelectRow
              label="Shadow"
              value={picks.shadow}
              onChange={(v) => setPicks((p) => ({ ...p, shadow: v }))}
              options={shadowOpts}
              developerDetails={developerDetails}
              simpleCategory="shadow"
            />
            )}
            {(!panelControls || panelControls.showHideShow) && !developerDetails ? (
              <div className="nuvio-row-wrap">
                <button
                  type="button"
                  disabled={structuralActionsDisabled}
                  className="nuvio-button"
                  onClick={() => onRequestStructuralPreview(buildHideOp())}
                >
                  Hide
                </button>
                <button
                  type="button"
                  disabled={structuralActionsDisabled}
                  className="nuvio-button"
                  onClick={() => onRequestStructuralPreview(buildShowOp())}
                >
                  Show
                </button>
              </div>
            ) : null}
            {developerDetails && LAYOUT_HELPERS.length > 0 ? (
              <div className="nuvio-stack-1">
                <p className="nuvio-label">Layout</p>
                <div className="nuvio-row-wrap">
                  {LAYOUT_HELPERS.map((helper) => (
                    <button
                      key={helper.id}
                      type="button"
                      className="nuvio-button-chip"
                      onClick={() => setPicks((p) => ({ ...p, ...helper.patch }))}
                    >
                      {helper.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {developerDetails ? (
            <details className="nuvio-more-styles">
              <summary className="nuvio-section-title nuvio-more-styles-summary">
                More styles
              </summary>
            <div className="nuvio-stack-2 nuvio-pt-1">
              <p className="nuvio-group-title">Typography</p>
              <SelectRow
                label="Font size"
                value={picks.fontSize}
                onChange={(v) => setPicks((p) => ({ ...p, fontSize: v }))}
                options={fontSizeOpts}
              />
              <SelectRow
                label="Weight"
                value={picks.fontWeight}
                onChange={(v) => setPicks((p) => ({ ...p, fontWeight: v }))}
                options={fontWeightOpts}
              />
              <SelectRow
                label="Line height"
                value={picks.lineHeight}
                onChange={(v) => setPicks((p) => ({ ...p, lineHeight: v }))}
                options={lineHeightOpts}
              />
              <SelectRow
                label="Letter spacing"
                value={picks.letterSpacing}
                onChange={(v) => setPicks((p) => ({ ...p, letterSpacing: v }))}
                options={letterSpacingOpts}
              />
              <SelectRow
                label="Text align"
                value={picks.textAlign}
                onChange={(v) => setPicks((p) => ({ ...p, textAlign: v }))}
                options={textAlignOpts}
              />

              <p className="nuvio-group-title">Spacing</p>
              <SelectRow
                label="Padding X"
                value={picks.paddingX}
                onChange={(v) => setPicks((p) => ({ ...p, paddingX: v }))}
                options={padXOpts}
              />
              <SelectRow
                label="Padding Y"
                value={picks.paddingY}
                onChange={(v) => setPicks((p) => ({ ...p, paddingY: v }))}
                options={padYOpts}
              />
              <SelectRow
                label="Margin"
                value={picks.margin}
                onChange={(v) => setPicks((p) => ({ ...p, margin: v }))}
                options={marginOpts}
              />
              <SelectRow
                label="Margin X"
                value={picks.marginX}
                onChange={(v) => setPicks((p) => ({ ...p, marginX: v }))}
                options={marginXOpts}
              />
              <SelectRow
                label="Margin Y"
                value={picks.marginY}
                onChange={(v) => setPicks((p) => ({ ...p, marginY: v }))}
                options={marginYOpts}
              />

              <p className="nuvio-group-title">Layout</p>
              <SelectRow
                label="Flex direction"
                value={picks.flexDirection}
                onChange={(v) => setPicks((p) => ({ ...p, flexDirection: v }))}
                options={flexDirectionOpts}
              />
              <SelectRow
                label="Justify"
                value={picks.justify}
                onChange={(v) => setPicks((p) => ({ ...p, justify: v }))}
                options={justifyOpts}
              />
              <SelectRow
                label="Items align"
                value={picks.items}
                onChange={(v) => setPicks((p) => ({ ...p, items: v }))}
                options={itemsOpts}
              />
              <SelectRow
                label="Grid columns"
                value={picks.gridCols}
                onChange={(v) => setPicks((p) => ({ ...p, gridCols: v }))}
                options={gridColsOpts}
              />
              <SelectRow
                label="Gap"
                value={picks.gap}
                onChange={(v) => setPicks((p) => ({ ...p, gap: v }))}
                options={gapOpts}
              />
              <SelectRow
                label="Width"
                value={picks.width}
                onChange={(v) => setPicks((p) => ({ ...p, width: v }))}
                options={widthOpts}
              />
              <SelectRow
                label="Max width"
                value={picks.maxWidth}
                onChange={(v) => setPicks((p) => ({ ...p, maxWidth: v }))}
                options={maxWidthOpts}
              />
              <SelectRow
                label="Height"
                value={picks.height}
                onChange={(v) => setPicks((p) => ({ ...p, height: v }))}
                options={heightOpts}
              />
              <SelectRow
                label="Min height"
                value={picks.minHeight}
                onChange={(v) => setPicks((p) => ({ ...p, minHeight: v }))}
                options={minHeightOpts}
              />

              <p className="nuvio-group-title">Visual</p>
              <SelectRow
                label="Opacity"
                value={picks.opacity}
                onChange={(v) => setPicks((p) => ({ ...p, opacity: v }))}
                options={opacityOpts}
              />
              <SelectRow
                label="Shadow"
                value={picks.shadow}
                onChange={(v) => setPicks((p) => ({ ...p, shadow: v }))}
                options={shadowOpts}
              />
              <SelectRow
                label="Border width"
                value={picks.borderWidth}
                onChange={(v) => setPicks((p) => ({ ...p, borderWidth: v }))}
                options={borderWidthOpts}
              />
              <SelectRow
                label="Border color"
                value={picks.borderColor}
                onChange={(v) => setPicks((p) => ({ ...p, borderColor: v }))}
                options={borderColorOpts}
              />
              <SelectRow
                label="Ring width"
                value={picks.ringWidth}
                onChange={(v) => setPicks((p) => ({ ...p, ringWidth: v }))}
                options={ringWidthOpts}
              />
              <SelectRow
                label="Ring color"
                value={picks.ringColor}
                onChange={(v) => setPicks((p) => ({ ...p, ringColor: v }))}
                options={ringColorOpts}
              />
            </div>
            </details>
            ) : null}
            {previewSummary && !structuralPreviewActive && developerDetails ? (
              <div className="nuvio-preview-box">
                <p className="nuvio-preview-box-title">Ready to apply</p>
                <p className="nuvio-preview-box-body">
                  {developerDetails ? previewSummary : humanPreviewBlock || previewSummary}
                </p>
              </div>
            ) : null}
            {developerDetails ? (
            <div className="nuvio-row-wrap nuvio-pt-2">
              <button
                type="button"
                disabled={patchActionsDisabled}
                className="nuvio-button"
                onClick={() => {
                  const resolved = resolvePatchApplyId();
                  if ("error" in resolved) {
                    setPatchTargetError(resolved.error);
                    return;
                  }
                  setPatchTargetError(null);
                  onRequestPreview(stagedOps, resolved.id);
                }}
              >
                {previewButtonLabel}
              </button>
              <button
                type="button"
                disabled={applyDisabled}
                className="nuvio-button nuvio-button-primary"
                onClick={() => {
                  if (previewValidatedOps?.length) {
                    const resolved = resolvePatchApplyId();
                    if ("error" in resolved) {
                      setPatchTargetError(resolved.error);
                      return;
                    }
                    setPatchTargetError(null);
                    onRequestApply([...previewValidatedOps], resolved.id);
                  }
                }}
              >
                {applyButtonLabel}
              </button>
              <button
                type="button"
                disabled={!channelReady || undoStackDepth <= 0}
                className="nuvio-button nuvio-button-ghost"
                onClick={() => onRequestUndo()}
              >
                Undo
              </button>
              <button
                type="button"
                className="nuvio-button nuvio-button-ghost"
                onClick={() => onCancelPreview()}
              >
                Cancel
              </button>
            </div>
            ) : null}
          </section>
        ) : null}

        {simpleMode && selectedId ? (
          <details className="nuvio-card nuvio-advanced-panel">
            <summary className="nuvio-section-title nuvio-advanced-summary">Advanced</summary>
            <div className="nuvio-stack-2 nuvio-pt-1">
              {showResponsiveDeviceControls ? (
                <DeviceBreakpointPanel
                  variant="compact"
                  devicePreset={devicePreset}
                  onDevicePresetChange={onDevicePresetChange}
                  activeBreakpoint={activeBreakpoint}
                  onActiveBreakpointChange={onActiveBreakpointChange}
                  developerDetails={false}
                />
              ) : null}
              {showQuickStyle ? (
                <>
                  <ColorPickerRow
                    label="Text color"
                    value={picks.textColor}
                    onChange={(v) => setPicks((p) => ({ ...p, textColor: v }))}
                    options={TEXT_COLOR_OPTIONS}
                    utilityPrefix="text"
                    simpleMode
                  />
                  <SelectRow
                    label="Size"
                    value={picks.fontSize}
                    onChange={(v) => setPicks((p) => ({ ...p, fontSize: v }))}
                    options={fontSizeOpts}
                    developerDetails={false}
                    simpleCategory="fontSize"
                  />
                  <SelectRow
                    label="Weight"
                    value={picks.fontWeight}
                    onChange={(v) => setPicks((p) => ({ ...p, fontWeight: v }))}
                    options={fontWeightOpts}
                    developerDetails={false}
                    simpleCategory="fontWeight"
                  />
                </>
              ) : null}
              {showSimpleEditControls && taskRouter.presetContext === "card" ? (
                <div className="nuvio-row-wrap">
                  {presetsForContext("card").map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="nuvio-button-chip"
                      onClick={() => setPicks((p) => applyStylePresetToPicks(p, preset.fragment))}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <details className="nuvio-outline-panel">
                <summary className="nuvio-label">Outline</summary>
                <ComponentTree
                  entries={indexEntries}
                  duplicateErrors={duplicateErrors}
                  selectedId={selectedId}
                  onSelectId={onSelectIndexedId}
                  friendlyLabels
                />
              </details>
              <button
                type="button"
                className="nuvio-button nuvio-button--block"
                onClick={() => onDeveloperDetailsChange(true)}
              >
                Show Developer Details
              </button>
            </div>
          </details>
        ) : null}

        {!simpleMode ? (
          <>
        {showResponsiveDeviceControls ? (
          <DeviceBreakpointPanel
            variant="section"
            devicePreset={devicePreset}
            onDevicePresetChange={onDevicePresetChange}
            activeBreakpoint={activeBreakpoint}
            onActiveBreakpointChange={onActiveBreakpointChange}
            developerDetails={developerDetails}
          />
        ) : null}

        {selectedId ? (
          <section className="nuvio-card nuvio-card--tree">
            <h3 className="nuvio-section-title">Component tree</h3>
            <ComponentTree
              entries={indexEntries}
              duplicateErrors={duplicateErrors}
              selectedId={selectedId}
              onSelectId={onSelectIndexedId}
              friendlyLabels={false}
            />
          </section>
        ) : null}
          </>
        ) : null}
          </>
        )}

        {simpleMode &&
        selectedId &&
        (displayPreviewError ||
          displayPatchBlockedReason ||
          (selectedEntry?.riskLevel === "unsupported" && selectedEntry?.textEditable !== true)) ? (
          <HandoffActionBar
            reason={
              displayPreviewError ??
              displayPatchBlockedReason ??
              getSimpleBlockedEditFallback(selectedId, selectedEntry)
            }
            simpleMode
            suggestedAction={getPlainPatchAction(
              displayPreviewError ?? displayPatchBlockedReason ?? "unsupported",
            )}
            hostId={selectedId ?? ""}
            file={resolvedFile}
            line={resolvedLine}
            componentName={selectedEntry?.componentName}
            tableContext={detectTableMode(selectedEntry)}
            onSwitchTarget={() => {
              const target = textTargets.find((t) => t.textEditable && t.nuvioId);
              if (target?.nuvioId) {
                onSelectIndexedId(target.nuvioId);
              }
            }}
            onAddIdHint={() => {
              void copyTextToClipboard(MAKE_TABLE_EDITABLE_SNIPPET);
            }}
            onChangeBreakpoint={() => onActiveBreakpointChange("base")}
          />
        ) : null}

        {simpleMode && editorTab !== "brand" && selectedId && !missing ? (
          <SimpleModeActionBar
            previewLabel={previewButtonLabel}
            applyLabel={applyButtonLabel}
            previewBusy={previewBusy && !structuralPreviewActive}
            previewDisabled={patchActionsDisabled}
            applyDisabled={applyDisabled}
            undoDisabled={!channelReady || undoStackDepth <= 0}
            hasStagedOps={hasStagedOps}
            previewReady={previewReady}
            humanPreviewBlock={humanPreviewBlock}
            structuralPreviewActive={structuralPreviewActive}
            brandPreviewSummary={brandPreviewSummary}
            brandApplyReady={brandApplyReady}
            brandBulkApplyReady={brandBulkApplyReady}
            brandBulkFlowActive={editorTab === "brand" && brandBulkApplyReady}
            brandPagePreviewActive={brandPagePreviewActive}
            onBrandPagePreview={() => onRequestBrandPagePreview()}
            onPreview={() => {
              const resolved = resolvePatchApplyId();
              if ("error" in resolved) {
                setPatchTargetError(resolved.error);
                return;
              }
              setPatchTargetError(null);
              onRequestPreview(stagedOps, resolved.id);
            }}
            onApply={() => {
              if (brandBulkApplyReady) {
                onRequestBrandBulkApply();
                return;
              }
              if (previewValidatedOps?.length) {
                const resolved = resolvePatchApplyId();
                if ("error" in resolved) {
                  setPatchTargetError(resolved.error);
                  return;
                }
                setPatchTargetError(null);
                onRequestApply([...previewValidatedOps], resolved.id);
              }
            }}
            onUndo={() => onRequestUndo()}
          />
        ) : null}
        </div>
      </div>
    </aside>
  );
}
