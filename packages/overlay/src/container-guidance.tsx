import type { IndexWireEntry, TextWireTarget } from "@nuvio/shared";
import type { ReactElement } from "react";
import { detectSimpleRouterMode } from "./task-router-modes.js";
import { formatFriendlyId } from "./selection-summary.js";

export type ContainerGuidanceProps = {
  entry: IndexWireEntry;
  selectedId: string;
  textTargets: readonly TextWireTarget[];
  indexEntries: readonly IndexWireEntry[];
  developerDetails: boolean;
  taskRouterActive: boolean;
  onSwitchToTarget: (target: { nuvioId?: string; key: string }) => void;
  onSelectId: (id: string) => void;
  onCopyFixPrompt?: () => void;
};

type GuidanceChoice = {
  label: string;
  nuvioId?: string;
  key?: string;
};

export function shouldShowContainerGuidance(
  entry: IndexWireEntry,
  selectedId: string,
  indexEntries: readonly IndexWireEntry[],
  developerDetails: boolean,
  taskRouterActive: boolean,
): boolean {
  if (developerDetails || taskRouterActive) {
    return false;
  }
  if (entry.textEditable !== false) {
    return false;
  }
  if (detectSimpleRouterMode(entry, selectedId, indexEntries)) {
    return false;
  }
  return true;
}

function categorizeTarget(target: TextWireTarget, entry: IndexWireEntry): string {
  const id = (target.nuvioId ?? target.label).toLowerCase();
  if (id.includes("button") || id.includes(".cta") || id.includes(".filter") || id.includes(".seeall")) {
    return "Edit button";
  }
  if (id.endsWith(".card") || entry.hierarchyRole === "card") {
    return "Edit card";
  }
  if (
    id.endsWith(".title") ||
    id.endsWith(".heading") ||
    id.endsWith(".lead") ||
    id.includes(".header.")
  ) {
    return "Edit title";
  }
  return "Edit text";
}

function buildGuidanceChoices(
  entry: IndexWireEntry,
  textTargets: readonly TextWireTarget[],
  indexEntries: readonly IndexWireEntry[],
): GuidanceChoice[] {
  const editable = textTargets.filter((t) => t.textEditable);
  const fromTargets: GuidanceChoice[] = [];
  const seen = new Set<string>();

  for (const target of editable) {
    const label = categorizeTarget(target, entry);
    const dedupeKey = target.nuvioId ?? target.key;
    if (seen.has(`${label}:${dedupeKey}`)) {
      continue;
    }
    seen.add(`${label}:${dedupeKey}`);
    fromTargets.push({
      label,
      nuvioId: target.nuvioId,
      key: target.key,
    });
  }

  const cardChild = indexEntries.find(
    (e) => e.parentHostId === entry.id && (e.id.endsWith(".card") || e.hierarchyRole === "card"),
  );
  if (cardChild && !seen.has(`Edit card:${cardChild.id}`)) {
    fromTargets.push({ label: "Edit card", nuvioId: cardChild.id });
  }

  const navChild = indexEntries.find(
    (e) => e.id.startsWith("nav.") && (e.parentHostId === entry.id || entry.id.includes("sidebar")),
  );
  if (navChild && !fromTargets.some((c) => c.label === "Edit button")) {
    fromTargets.push({ label: "Edit button", nuvioId: navChild.id });
  }

  const uniqueLabels = new Map<string, GuidanceChoice>();
  for (const choice of fromTargets) {
    if (!uniqueLabels.has(choice.label)) {
      uniqueLabels.set(choice.label, choice);
    }
  }
  return [...uniqueLabels.values()].slice(0, 4);
}

export function ContainerGuidance({
  entry,
  selectedId,
  textTargets,
  indexEntries,
  developerDetails,
  taskRouterActive,
  onSwitchToTarget,
  onSelectId,
  onCopyFixPrompt,
}: ContainerGuidanceProps): ReactElement | null {
  if (!shouldShowContainerGuidance(entry, selectedId, indexEntries, developerDetails, taskRouterActive)) {
    return null;
  }
  if (textTargets.length === 0 && !entry.id.includes("sidebar")) {
    return null;
  }

  const choices = buildGuidanceChoices(entry, textTargets, indexEntries);
  if (choices.length === 0) {
    return null;
  }

  if (developerDetails && choices.length === 1) {
    const target = choices[0];
    const label = target.nuvioId
      ? formatFriendlyId(target.nuvioId, entry)
      : (textTargets.find((t) => t.key === target.key)?.textPreview ?? target.label);
    return (
      <div className="nuvio-banner nuvio-banner--info nuvio-stack-2">
        <p className="nuvio-text-2xs nuvio-leading-snug">
          This area is a layout container. Edit the{" "}
          <span className="nuvio-font-medium">{label}</span> instead?
        </p>
        <button
          type="button"
          className="nuvio-button nuvio-button-primary"
          onClick={() => {
            if (target.nuvioId) {
              onSelectId(target.nuvioId);
            } else if (target.key) {
              onSwitchToTarget({ key: target.key, nuvioId: target.nuvioId });
            }
          }}
        >
          {target.label}
        </button>
      </div>
    );
  }

  return (
    <div className="nuvio-banner nuvio-banner--info nuvio-stack-2">
      <p className="nuvio-text-2xs nuvio-leading-snug">This area has editable parts.</p>
      <div className="nuvio-stack-1">
        {choices.map((choice) => (
          <button
            key={`${choice.label}-${choice.nuvioId ?? choice.key}`}
            type="button"
            className="nuvio-button nuvio-button--block"
            onClick={() => {
              if (choice.nuvioId) {
                onSelectId(choice.nuvioId);
              } else if (choice.key) {
                onSwitchToTarget({ key: choice.key, nuvioId: choice.nuvioId });
              }
            }}
          >
            {choice.label}
          </button>
        ))}
        {onCopyFixPrompt ? (
          <button type="button" className="nuvio-button nuvio-button-ghost nuvio-button--block" onClick={onCopyFixPrompt}>
            Copy Fix Prompt
          </button>
        ) : null}
      </div>
    </div>
  );
}
