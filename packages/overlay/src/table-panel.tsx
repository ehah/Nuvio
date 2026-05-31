import type { IndexWireEntry, RowWireTarget } from "@nuvio/shared";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { formatFriendlyId } from "./selection-summary.js";

export type TableSubTarget = "section" | "headers" | "rows";

export type TablePanelProps = {
  entry: IndexWireEntry;
  indexEntries: readonly IndexWireEntry[];
  selectedId: string;
  developerDetails: boolean;
  onSelectId: (id: string) => void;
};

function headerEntries(entry: IndexWireEntry, all: readonly IndexWireEntry[]): IndexWireEntry[] {
  const prefix = entry.id.replace(/\.(section|table)$/, "");
  return all.filter((e) => e.id.startsWith(`${prefix}.header.`) && e.id !== `${prefix}.header.row`);
}

export function detectTableMode(entry: IndexWireEntry | undefined): boolean {
  if (!entry) {
    return false;
  }
  if (entry.hierarchyRole === "table") {
    return true;
  }
  return entry.id.includes(".table") || (entry.rowTargets?.length ?? 0) > 0;
}

function inferSubTarget(
  selectedId: string,
  prefix: string,
  headers: IndexWireEntry[],
  rows: RowWireTarget[],
): TableSubTarget {
  if (selectedId.includes(".header.")) {
    return "headers";
  }
  if (selectedId.includes(".row.")) {
    return "rows";
  }
  if (headers.some((h) => h.id === selectedId)) {
    return "headers";
  }
  if (rows.some((r) => r.nuvioId === selectedId)) {
    return "rows";
  }
  if (selectedId === `${prefix}.section` || selectedId === `${prefix}.table`) {
    return "section";
  }
  return "section";
}

export function getTableHeaderEntries(
  entry: IndexWireEntry,
  all: readonly IndexWireEntry[],
): IndexWireEntry[] {
  return headerEntries(entry, all);
}

export function TableColumnHeaderPicker({
  headers,
  selectedId,
  developerDetails,
  onSelectId,
}: {
  headers: readonly IndexWireEntry[];
  selectedId: string;
  developerDetails: boolean;
  onSelectId: (id: string) => void;
}): ReactElement | null {
  if (headers.length === 0) {
    return null;
  }
  return (
    <label className="nuvio-block nuvio-stack-1">
      <span className="nuvio-label">Column</span>
      <select
        className="nuvio-control nuvio-select"
        value={headers.find((h) => h.id === selectedId)?.id ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            onSelectId(e.target.value);
          }
        }}
      >
        <option value="">Choose a column…</option>
        {headers.map((h) => (
          <option key={h.id} value={h.id}>
            {developerDetails ? h.id : formatFriendlyId(h.id, h)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TableRowPicker({
  rows,
  selectedId,
  onSelectId,
}: {
  rows: readonly RowWireTarget[];
  selectedId: string;
  onSelectId: (id: string) => void;
}): ReactElement | null {
  if (rows.length === 0) {
    return null;
  }
  const activeRow =
    rows.find((r) => r.nuvioId === selectedId || selectedId.startsWith(`${r.nuvioId}.`))?.nuvioId ??
    "";
  return (
    <label className="nuvio-block nuvio-stack-1">
      <span className="nuvio-label">Row</span>
      <select
        className="nuvio-control nuvio-select"
        value={activeRow}
        onChange={(e) => {
          if (e.target.value) {
            onSelectId(e.target.value);
          }
        }}
      >
        <option value="">Choose a row…</option>
        {rows.map((r) => (
          <option key={r.nuvioId} value={r.nuvioId}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TablePanel({
  entry,
  indexEntries,
  selectedId,
  developerDetails,
  onSelectId,
}: TablePanelProps): ReactElement | null {
  const prefix = useMemo(() => entry.id.replace(/\.(section|table)$/, ""), [entry.id]);
  const sectionId = `${prefix}.section`;
  const headers = useMemo(() => headerEntries(entry, indexEntries), [entry, indexEntries]);
  const rows = entry.rowTargets ?? [];

  const inferredSubTarget = useMemo(
    () => inferSubTarget(selectedId, prefix, headers, rows),
    [selectedId, prefix, headers, rows],
  );
  const [subTarget, setSubTarget] = useState<TableSubTarget>(inferredSubTarget);

  useEffect(() => {
    setSubTarget(inferredSubTarget);
  }, [inferredSubTarget]);

  useEffect(() => {
    if (
      selectedId === `${prefix}.table` &&
      subTarget === "section" &&
      !headers.some((h) => h.id === selectedId)
    ) {
      onSelectId(sectionId);
    }
  }, [selectedId, prefix, sectionId, subTarget, headers, onSelectId]);

  if (!detectTableMode(entry)) {
    return null;
  }

  const sectionEntry = indexEntries.find((e) => e.id === sectionId) ?? entry;
  const titleEntry = indexEntries.find((e) => e.id === `${prefix}.title`);

  return (
    <section className="nuvio-card nuvio-stack-2">
      <h3 className="nuvio-section-title">
        {developerDetails
          ? "Table mode"
          : `Editing: ${formatFriendlyId(prefix, titleEntry ?? sectionEntry)} table`}
      </h3>
      <div className="nuvio-row-wrap">
        {(
          [
            ["section", developerDetails ? "Section" : "Table Style"],
            ["headers", developerDetails ? "Column headers" : "Column Headers"],
            ["rows", "Rows"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`nuvio-button-chip ${subTarget === value ? "nuvio-button-chip--active" : ""}`}
            onClick={() => {
              setSubTarget(value);
              if (value === "section") {
                onSelectId(sectionEntry.id);
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {subTarget === "section" ? (
        <div className="nuvio-row-wrap">
          <button
            type="button"
            className={`nuvio-button-chip ${selectedId === sectionEntry.id ? "nuvio-button-chip--active" : ""}`}
            onClick={() => onSelectId(sectionEntry.id)}
          >
            Card Style
          </button>
          {titleEntry ? (
            <button
              type="button"
              className={`nuvio-button-chip ${selectedId === titleEntry.id ? "nuvio-button-chip--active" : ""}`}
              onClick={() => onSelectId(titleEntry.id)}
            >
              {formatFriendlyId(titleEntry.id, titleEntry)}
            </button>
          ) : null}
        </div>
      ) : null}

      {subTarget === "headers" ? (
        <TableColumnHeaderPicker
          headers={headers}
          selectedId={selectedId}
          developerDetails={developerDetails}
          onSelectId={onSelectId}
        />
      ) : null}

      {subTarget === "rows" ? (
        <>
          <TableRowPicker rows={rows} selectedId={selectedId} onSelectId={onSelectId} />
          {selectedId.includes(".nameText") || selectedId.includes(".name") ? (
            <p className="nuvio-text-2xs nuvio-text-muted">Edit the product name below.</p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
