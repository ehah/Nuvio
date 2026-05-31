import type { IndexWireEntry } from "@nuvio/shared";
import { useMemo, type ReactElement } from "react";
import { formatFriendlyId } from "./selection-summary.js";
import { detectTableMode, TablePanel } from "./table-panel.js";

export type ComponentModeKind = "table" | "card" | "chart" | "nav" | "form" | "button";

export type ComponentModePanelProps = {
  entry: IndexWireEntry;
  indexEntries: readonly IndexWireEntry[];
  selectedId: string;
  developerDetails: boolean;
  onSelectId: (id: string) => void;
};

function detectComponentMode(entry: IndexWireEntry | undefined): ComponentModeKind | null {
  if (!entry) {
    return null;
  }
  if (detectTableMode(entry)) {
    return "table";
  }
  const role = entry.hierarchyRole;
  if (role === "card" || entry.id.endsWith(".card")) {
    return "card";
  }
  if (role === "form" || entry.id.includes(".form")) {
    return "form";
  }
  if (role === "button" || entry.id.includes(".button") || entry.id.includes(".filter")) {
    return "button";
  }
  if (entry.id.includes(".nav") || entry.id.includes(".sidebar")) {
    return "nav";
  }
  if (entry.id.includes(".chart") || entry.id.endsWith(".subtitle")) {
    return "chart";
  }
  return null;
}

function childTargets(
  entry: IndexWireEntry,
  all: readonly IndexWireEntry[],
  suffixes: readonly string[],
): IndexWireEntry[] {
  const prefix = entry.id.replace(/\.(section|card|table)$/, "");
  return all.filter((e) => {
    if (e.id === entry.id) {
      return false;
    }
    if (!e.id.startsWith(`${prefix}.`)) {
      return false;
    }
    return suffixes.some((s) => e.id.endsWith(s) || e.id.includes(s));
  });
}

function ModeHeader({
  kind,
  entry,
  developerDetails,
}: {
  kind: ComponentModeKind;
  entry: IndexWireEntry;
  developerDetails: boolean;
}): ReactElement {
  const labels: Record<ComponentModeKind, string> = {
    table: "table",
    card: "card",
    chart: "chart block",
    nav: "navigation",
    form: "form field",
    button: "button",
  };
  const prefix = entry.id.replace(/\.(section|card|table|button)$/, "");
  return (
    <h3 className="nuvio-section-title">
      {developerDetails
        ? `${kind} mode`
        : `Editing: ${formatFriendlyId(prefix, entry)} ${labels[kind]}`}
    </h3>
  );
}

function TargetChips({
  targets,
  selectedId,
  developerDetails,
  onSelectId,
}: {
  targets: IndexWireEntry[];
  selectedId: string;
  developerDetails: boolean;
  onSelectId: (id: string) => void;
}): ReactElement | null {
  if (targets.length === 0) {
    return null;
  }
  return (
    <div className="nuvio-row-wrap">
      {targets.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`nuvio-button-chip ${selectedId === t.id ? "nuvio-button-chip--active" : ""}`}
          onClick={() => onSelectId(t.id)}
        >
          {developerDetails ? t.id : formatFriendlyId(t.id, t)}
        </button>
      ))}
    </div>
  );
}

export function ComponentModePanel(props: ComponentModePanelProps): ReactElement | null {
  const { entry, indexEntries, selectedId, developerDetails, onSelectId } = props;
  const kind = detectComponentMode(entry);

  const quickTargets = useMemo(() => {
    if (!kind || kind === "table") {
      return [];
    }
    const map: Record<Exclude<ComponentModeKind, "table">, readonly string[]> = {
      card: [".label", ".value", ".title"],
      chart: [".title", ".subtitle", ".card"],
      nav: [".nav", ".link", ".item"],
      form: [".label", ".input"],
      button: [".filter", ".seeAll", ".button"],
    };
    return childTargets(entry, indexEntries, map[kind]);
  }, [entry, indexEntries, kind]);

  if (kind === "table") {
    return <TablePanel {...props} />;
  }

  if (!kind || quickTargets.length === 0) {
    return null;
  }

  return (
    <section className="nuvio-card nuvio-stack-2">
      <ModeHeader kind={kind} entry={entry} developerDetails={developerDetails} />
      <p className="nuvio-text-2xs nuvio-text-muted">Pick the part you want to change:</p>
      <TargetChips
        targets={quickTargets}
        selectedId={selectedId}
        developerDetails={developerDetails}
        onSelectId={onSelectId}
      />
    </section>
  );
}

export { detectComponentMode };
