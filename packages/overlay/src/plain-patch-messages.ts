export type PlainPatchAction =
  | "switchTarget"
  | "addId"
  | "useHandoff"
  | "changeBreakpoint"
  | "none";

export type PlainPatchMessage = {
  sentence: string;
  suggestedAction: PlainPatchAction;
};

const REASON_MAP: ReadonlyArray<{
  match: (reason: string) => boolean;
  message: PlainPatchMessage;
}> = [
  {
    match: (r) => r.includes("string literal") && r.includes("className"),
    message: {
      sentence: "This element uses dynamic class names, so color and spacing edits aren't available here.",
      suggestedAction: "useHandoff",
    },
  },
  {
    match: (r) => r.includes(".map()"),
    message: {
      sentence: "This is inside a repeated list — pick a specific row or column header to edit safely.",
      suggestedAction: "switchTarget",
    },
  },
  {
    match: (r) => r.includes("Custom React component"),
    message: {
      sentence: "This is a custom component — styles only work when className reaches a real HTML element.",
      suggestedAction: "useHandoff",
    },
  },
  {
    match: (r) => r.includes("leaf elements") || r.includes("nested elements"),
    message: {
      sentence: "This is a layout container. Use the button below to edit the title or label inside it.",
      suggestedAction: "switchTarget",
    },
  },
  {
    match: (r) => r.includes("dark:") || r.includes("Responsive"),
    message: {
      sentence: "This element has responsive or dark-mode classes — check desktop and mobile after applying.",
      suggestedAction: "changeBreakpoint",
    },
  },
  {
    match: (r) => r.includes("duplicate"),
    message: {
      sentence: "This name is used more than once in your project — each area needs a unique id.",
      suggestedAction: "addId",
    },
  },
  {
    match: (r) => r.includes("not in the dev source index"),
    message: {
      sentence: "This part isn't wired for editing yet. Restart the dev server after adding ids.",
      suggestedAction: "addId",
    },
  },
  {
    match: (r) => r.includes("first sibling"),
    message: {
      sentence: "This item is already first in its row — it can't move up further.",
      suggestedAction: "none",
    },
  },
  {
    match: (r) => r.includes("last sibling"),
    message: {
      sentence: "This item is already last in its row — it can't move down further.",
      suggestedAction: "none",
    },
  },
  {
    match: (r) => r.includes("No changes"),
    message: {
      sentence: "Change text or a style first, then validate.",
      suggestedAction: "none",
    },
  },
  {
    match: (r) => r.includes("Text cannot be patched"),
    message: {
      sentence: "Text can't be edited on this selection — pick a headline or label target below.",
      suggestedAction: "switchTarget",
    },
  },
  {
    match: (r) => r.includes("Styles cannot be patched"),
    message: {
      sentence: "Styles aren't available for this element — try the card container or a child with an id.",
      suggestedAction: "switchTarget",
    },
  },
  {
    match: (r) => r.includes("different elements"),
    message: {
      sentence: "Text and styles apply to different parts — validate text first, then change styles.",
      suggestedAction: "switchTarget",
    },
  },
  {
    match: (r) => r.includes("host_not_found") || r.includes("No JSX host"),
    message: {
      sentence: "Nuvio couldn't find this element in source — click it again or refresh the page.",
      suggestedAction: "addId",
    },
  },
  {
    match: (r) => r.includes("parse_error"),
    message: {
      sentence: "This file couldn't be parsed — fix syntax errors in the component file first.",
      suggestedAction: "useHandoff",
    },
  },
  {
    match: (r) => r.includes("table data") || r.includes("tableData"),
    message: {
      sentence: "This cell reads from table data — use the row target to edit the product name.",
      suggestedAction: "switchTarget",
    },
  },
];

export function mapReasonToPlainMessage(reason: string): PlainPatchMessage {
  const trimmed = reason.trim();
  for (const entry of REASON_MAP) {
    if (entry.match(trimmed)) {
      return entry.message;
    }
  }
  return {
    sentence: "This change couldn't be applied safely. Use Copy Fix Prompt for Cursor or turn on Developer details.",
    suggestedAction: "useHandoff",
  };
}

export function formatPatchUserMessagePlain(message: string | null | undefined): string | null {
  if (!message) {
    return null;
  }
  const stripped = message.replace(/^Error:\s*/i, "").trim();
  return mapReasonToPlainMessage(stripped).sentence;
}

export function getPlainPatchAction(message: string | null | undefined): PlainPatchAction {
  if (!message) {
    return "none";
  }
  const stripped = message.replace(/^Error:\s*/i, "").trim();
  return mapReasonToPlainMessage(stripped).suggestedAction;
}
