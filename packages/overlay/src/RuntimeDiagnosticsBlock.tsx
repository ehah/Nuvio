import type { DuplicateIdError, IndexWireEntry, RuntimeDiagnostics } from "@nuvio/shared";
import type { ReactElement } from "react";
import {
  formatSelectionTitle,
  getSimpleChipIndexedLabel,
  getSimpleDuplicateWarning,
  getSimpleIndexEmptyMessage,
  getSimpleSelectErrorMessage,
} from "./selection-summary.js";

export type NuvioChannelState = "idle" | "connecting" | "ready" | "error";

function statusDotClass(channel: NuvioChannelState, indexedCount: number): string {
  if (indexedCount === 0 && channel === "ready") {
    return "nuvio-status-dot nuvio-status-dot--warn";
  }
  if (channel === "ready") {
    return "nuvio-status-dot nuvio-status-dot--connected";
  }
  if (channel === "connecting") {
    return "nuvio-status-dot nuvio-status-dot--connecting";
  }
  if (channel === "error") {
    return "nuvio-status-dot nuvio-status-dot--error";
  }
  return "nuvio-status-dot nuvio-status-dot--idle";
}

function statusLabel(channel: NuvioChannelState, channelLabel: string): string {
  if (channel === "ready") {
    return channelLabel === "connected" ? "Connected" : channelLabel;
  }
  if (channel === "connecting") {
    return "Connecting";
  }
  if (channel === "error") {
    return "Error";
  }
  return "Offline";
}

/** Stack versions row for the Editor panel only. */
export function EditorStackVersions({
  diagnostics,
}: {
  diagnostics: RuntimeDiagnostics | null;
}): ReactElement | null {
  if (!diagnostics?.viteVersion && !diagnostics?.reactVersion && !diagnostics?.tailwindVersion) {
    return null;
  }
  return (
    <p className="nuvio-editor-versions">
      {diagnostics.viteVersion ? `Vite ${diagnostics.viteVersion}` : null}
      {diagnostics.viteVersion && diagnostics.reactVersion ? " · " : null}
      {diagnostics.reactVersion ? `React ${diagnostics.reactVersion}` : null}
      {(diagnostics.viteVersion || diagnostics.reactVersion) && diagnostics.tailwindVersion
        ? " · "
        : null}
      {diagnostics.tailwindVersion ? `Tailwind ${diagnostics.tailwindVersion}` : null}
    </p>
  );
}

/** Compact chip status — no duplicate Nuvio / Editing labels. */
export function NuvioChipStatus({
  channel,
  channelLabel,
  indexedCount,
  duplicateErrors,
  selectedId,
  selectedEntry,
  indexEntries,
  selectError,
  developerDetails,
}: {
  channel: NuvioChannelState;
  channelLabel: string;
  indexedCount: number;
  duplicateErrors: readonly DuplicateIdError[];
  selectedId: string | null;
  selectedEntry?: IndexWireEntry;
  indexEntries?: readonly IndexWireEntry[];
  selectError: string | null;
  developerDetails: boolean;
}): ReactElement {
  const status = statusLabel(channel, channelLabel);
  const warnings: string[] = [];

  if (developerDetails) {
    if (indexedCount === 0 && channel === "ready") {
      warnings.push("0 ids — add data-nuvio-id to editable nodes");
    }
    if (duplicateErrors.length > 0) {
      warnings.push(`Duplicate ids: ${duplicateErrors.map((d) => d.id).join(", ")}`);
    }
    if (selectError) {
      warnings.push(selectError);
    }
  } else {
    if (indexedCount === 0 && channel === "ready") {
      warnings.push(getSimpleIndexEmptyMessage());
    }
    const dup = getSimpleDuplicateWarning(duplicateErrors);
    if (dup) {
      warnings.push(dup);
    }
    if (selectError) {
      warnings.push(getSimpleSelectErrorMessage(selectError));
    }
  }

  const indexedLabel = developerDetails
    ? `${indexedCount} id${indexedCount === 1 ? "" : "s"}`
    : getSimpleChipIndexedLabel(indexedCount);

  return (
    <div className="nuvio-chip-status">
      <p className="nuvio-chip-status-line">
        <span className={statusDotClass(channel, indexedCount)} aria-hidden="true" />
        <span className="nuvio-chip-status-text">
          <span className={channel === "ready" ? "nuvio-text-success" : "nuvio-text-muted"}>
            {status}
          </span>
          <span className="nuvio-text-dim"> · </span>
          <span className="nuvio-text-muted">{indexedLabel}</span>
        </span>
      </p>
      {selectedId ? (
        <p className="nuvio-chip-selected nuvio-truncate">
          <span className="nuvio-text-muted">Selected </span>
          <span className={developerDetails ? "nuvio-text-mono nuvio-text-accent" : "nuvio-text-accent"}>
            {developerDetails
              ? selectedId
              : formatSelectionTitle(selectedId, selectedEntry, indexEntries)}
          </span>
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <div className="nuvio-chip-warnings">
          {warnings.map((w) => (
            <p key={w} className="nuvio-chip-warning-line">
              {w}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use NuvioChipStatus or EditorStackVersions */
export function RuntimeDiagnosticsBlock(props: {
  channel: NuvioChannelState;
  channelLabel: string;
  indexedCount: number;
  duplicateErrors: readonly DuplicateIdError[];
  diagnostics: RuntimeDiagnostics | null;
  editMode: boolean;
  selectedId: string | null;
  selectError?: string | null;
}): ReactElement {
  return (
    <NuvioChipStatus
      channel={props.channel}
      channelLabel={props.channelLabel}
      indexedCount={props.indexedCount}
      duplicateErrors={props.duplicateErrors}
      selectedId={props.selectedId}
      selectError={props.selectError ?? null}
      developerDetails={false}
    />
  );
}
