import type { DuplicateIdError, IndexWireEntry } from "@nuvio/shared";
import { useMemo, useState, type ReactElement } from "react";
import { formatFriendlyId } from "./selection-summary.js";

export type ComponentTreeProps = {
  entries: readonly IndexWireEntry[];
  duplicateErrors: readonly DuplicateIdError[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  /** Simple mode: show friendly labels instead of raw ids. */
  friendlyLabels?: boolean;
};

function shortPath(file: string): string {
  const norm = file.replace(/\\/g, "/");
  const parts = norm.split("/");
  return parts.length <= 2 ? norm : parts.slice(-2).join("/");
}

function riskDotClass(level: IndexWireEntry["riskLevel"]): string {
  if (level === "unsupported") {
    return "nuvio-tree-risk nuvio-tree-risk--unsupported";
  }
  if (level === "caution") {
    return "nuvio-tree-risk nuvio-tree-risk--caution";
  }
  return "nuvio-tree-risk nuvio-tree-risk--safe";
}

export function ComponentTree({
  entries,
  duplicateErrors,
  selectedId,
  onSelectId,
  friendlyLabels = false,
}: ComponentTreeProps): ReactElement {
  type FilterKey = "all" | "text" | "style" | "structure" | "unsupported" | "duplicates";
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const selectedEntry = useMemo(
    () => (selectedId ? entries.find((e) => e.id === selectedId) : undefined),
    [entries, selectedId],
  );

  const hostContextEntries = useMemo(() => {
    if (!selectedEntry) {
      return entries;
    }
    const ids = new Set<string>([
      selectedEntry.id,
      ...(selectedEntry.childTargetIds ?? []),
      ...entries.filter((e) => e.parentHostId === selectedEntry.id).map((e) => e.id),
    ]);
    return entries.filter((e) => ids.has(e.id));
  }, [entries, selectedEntry]);

  const filtered = useMemo(() => {
    const src = selectedEntry ? hostContextEntries : entries;
    const needle = search.trim().toLowerCase();
    const out = src.filter((e) => {
      if (filter === "all" || filter === "duplicates") {
        /* keep */
      } else if (filter === "unsupported") {
        if (e.riskLevel !== "unsupported") {
          return false;
        }
      } else if (filter === "structure") {
        if (e.structuralEditable !== true) {
          return false;
        }
      } else if (filter === "style") {
        if (e.hasLiteralClassName !== true) {
          return false;
        }
      } else if (filter === "text") {
        if (e.textEditable !== true && e.hierarchyRole !== "text") {
          return false;
        }
      }
      if (needle) {
        const label = friendlyLabels ? formatFriendlyId(e.id, e) : e.id;
        const hay = `${label} ${e.id} ${e.tagName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) {
          return false;
        }
      }
      return true;
    });
    return [...out].sort((a, b) => a.id.localeCompare(b.id));
  }, [entries, filter, friendlyLabels, hostContextEntries, search, selectedEntry]);

  const groups = useMemo(() => {
    const map = new Map<string, IndexWireEntry[]>();
    for (const e of filtered) {
      const key = e.parentHostId ?? "__root__";
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <section>
      {!friendlyLabels ? <h3 className="nuvio-tree-title">Indexed elements</h3> : null}
      {friendlyLabels ? (
        <label className="nuvio-block nuvio-stack-1 nuvio-mb-2">
          <span className="nuvio-label">Search outline</span>
          <input
            type="search"
            className="nuvio-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, row, column…"
          />
        </label>
      ) : null}
      {!friendlyLabels ? (
      <div className="nuvio-tree-filters">
        {(["all", "text", "style", "structure", "unsupported", "duplicates"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`nuvio-tree-filter ${filter === key ? "nuvio-tree-filter--active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {key}
          </button>
        ))}
      </div>
      ) : null}
      {filter === "duplicates" ? (
        duplicateErrors.length === 0 ? (
          <p className="nuvio-text-xs nuvio-text-muted-dim">No duplicate ids reported.</p>
        ) : (
          <ul className="nuvio-tree-list">
            {duplicateErrors.map((dup) => (
              <li key={dup.id} className="nuvio-tree-item">
                <p className="nuvio-tree-dup-title">{dup.id}</p>
                {dup.occurrences.map((occ, i) => (
                  <p key={`${dup.id}-${i}`} className="nuvio-tree-btn-path">
                    {shortPath(occ.file)}:{occ.line}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )
      ) : filtered.length === 0 ? (
        <p className="nuvio-text-xs nuvio-text-muted-dim">No ids in dev index.</p>
      ) : (
        groups.map(([groupKey, group]) => (
          <div key={groupKey} className="nuvio-tree-group">
            {!friendlyLabels ? (
              <p className="nuvio-tree-group-title">
                {groupKey === "__root__" ? "Top-level hosts" : `Host: ${groupKey}`}
              </p>
            ) : null}
            <ul className="nuvio-tree-list">
              {group.map((e) => {
                const active = e.id === selectedId;
                return (
                  <li key={e.id} className="nuvio-tree-item">
                    <button
                      type="button"
                      className={`nuvio-tree-btn ${active ? "nuvio-tree-btn--active" : ""}`}
                      onClick={() => onSelectId(e.id)}
                    >
                      <span className="nuvio-tree-btn-row">
                        {!friendlyLabels && e.riskLevel ? (
                          <span
                            className={riskDotClass(e.riskLevel)}
                            title={e.riskLevel}
                            aria-hidden="true"
                          />
                        ) : null}
                        {!friendlyLabels ? (
                          <span className="nuvio-tree-role">{e.hierarchyRole ?? "unknown"}</span>
                        ) : null}
                        <span className={friendlyLabels ? "nuvio-break-all" : "nuvio-break-all nuvio-text-mono"}>
                          {friendlyLabels ? formatFriendlyId(e.id, e) : e.id}
                        </span>
                      </span>
                      {!friendlyLabels ? (
                        <span className="nuvio-tree-btn-path">
                          {e.tagName ? `${e.tagName} · ` : ""}
                          {shortPath(e.file)}:{e.line}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
