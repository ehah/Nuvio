import type { DuplicateIdError, IndexWireEntry } from "@nuvio/shared";

export {
  containsSimpleModeNamingLeak,
  formatCardDisplayName,
  formatCardGroupName,
  formatColumnHeaderTitle,
  formatFriendlyId,
  formatRowDisplayName,
  formatSelectionTitle,
  formatTableBackLabel,
  formatTableDisplayName,
  isTableCellId,
  resolveTableHostPrefix,
  SIMPLE_MODE_NAMING_LEAK_PATTERN,
} from "./human-naming.js";

import { formatFriendlyId } from "./human-naming.js";

export type SimpleStatusTone = "success" | "warn" | "neutral";

export function getSimpleSelectionStatus(entry: IndexWireEntry): {
  message: string;
  tone: SimpleStatusTone;
} {
  if (entry.riskLevel === "unsupported") {
    return {
      message: "This element can't be edited here. Try another part of the page.",
      tone: "warn",
    };
  }

  const targetCount = entry.textTargets?.length ?? 0;
  if (entry.textEditable === false && targetCount > 1) {
    return {
      message: "Choose what to edit below — headline, value, or other text in this area.",
      tone: "neutral",
    };
  }

  const textOk = entry.textEditable !== false;
  const classOk = entry.hasLiteralClassName !== false;

  if (textOk && classOk) {
    if (entry.riskLevel === "caution") {
      return {
        message: "You can edit text and styles here. Double-check the result looks right.",
        tone: "neutral",
      };
    }
    return {
      message: "You can edit text and styles here.",
      tone: "success",
    };
  }

  if (!textOk && classOk) {
    return {
      message: "You can edit styles here. For text, click the headline or label inside this area.",
      tone: "neutral",
    };
  }

  if (textOk && !classOk) {
    return {
      message:
        "You can edit text here. Style changes aren't available for this element — try another selection.",
      tone: "neutral",
    };
  }

  return {
    message: "Limited editing on this element — try a child element (title, button, or label).",
    tone: "warn",
  };
}

export function mapUnsupportedReasonToSimple(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes("string literal") || lower.includes("classname")) {
    return "This element uses dynamic className code, so style edits are disabled here.";
  }
  if (lower.includes(".map()")) {
    return "This element comes from a repeated list. Use explicit ids and verify each item carefully.";
  }
  if (lower.includes("custom react component")) {
    return "This is a custom React component. Styles only work if className is forwarded to a real DOM node.";
  }
  if (lower.includes("leaf elements")) {
    return "This is a container. Choose a text target inside it to edit copy.";
  }
  if (lower.includes("responsive") || lower.includes("dark:")) {
    return "Responsive or dark-mode classes are present. Check desktop and mobile after applying.";
  }
  return "This selection has a limitation. Turn on Developer details for technical info.";
}

export function getSimpleBlockedEditFallback(
  selectedId: string | null,
  selectedEntry?: IndexWireEntry | null,
): string {
  const textContext =
    selectedEntry?.textEditable === true ||
    (selectedId != null &&
      /\.(label|value|nameText|name|price|category|status|title|subtitle)$/.test(selectedId)) ||
    (selectedId != null && selectedId.includes(".header."));
  if (textContext) {
    return "Nuvio can't safely edit this text yet.";
  }
  return "Nuvio can't safely edit this element.";
}

export function getSimpleIndexEmptyMessage(): string {
  return "Nothing is set up to edit yet. Add Nuvio ids to elements in your project, then restart the dev server.";
}

export function getSimplePatchBlockedMessage(
  indexIdCount: number,
  selectionResolved: boolean,
): string | null {
  if (indexIdCount === 0) {
    return getSimpleIndexEmptyMessage();
  }
  if (!selectionResolved) {
    return "This selection isn't ready to save. Click another element or turn on Developer details.";
  }
  return null;
}

export function isDuplicateIndexedId(
  id: string,
  duplicateErrors: readonly DuplicateIdError[],
): boolean {
  return duplicateErrors.some((d) => d.id === id);
}

export function getSimpleDuplicateIdPatchMessage(id: string): string {
  return `“${formatFriendlyId(id)}” appears more than once on this page. Give each copy a unique name in your project, then restart the dev server.`;
}

export function getSimpleDuplicateWarning(duplicateErrors: readonly DuplicateIdError[]): string | null {
  if (duplicateErrors.length === 0) {
    return null;
  }
  const names = duplicateErrors.map((d) => formatFriendlyId(d.id)).join(", ");
  return `Two or more areas share the same name (${names}) — fix that before saving changes.`;
}

export function getSimpleChipIndexedLabel(indexedCount: number): string {
  if (indexedCount === 0) {
    return "No editable areas yet";
  }
  return `${indexedCount} editable area${indexedCount === 1 ? "" : "s"} on this page`;
}

export function getSimpleSelectErrorMessage(selectError: string): string {
  const lower = selectError.toLowerCase();
  if (lower.includes("duplicate")) {
    return "This name is used more than once — choose another element.";
  }
  if (lower.includes("className") || lower.includes("literal")) {
    return "Styles can't be changed for this selection.";
  }
  return "This selection can't be edited. Try another element.";
}
