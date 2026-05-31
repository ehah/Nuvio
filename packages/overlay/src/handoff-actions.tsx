import type { PlainPatchAction } from "./plain-patch-messages.js";
import {
  buildEditorUrl,
  buildFixHandoffClipboard,
  copyTextToClipboard,
  MAKE_TABLE_EDITABLE_SNIPPET,
} from "./fix-handoff.js";
import type { ReactElement } from "react";

export type HandoffActionBarProps = {
  reason: string;
  suggestedAction: PlainPatchAction;
  hostId: string;
  file?: string;
  line?: number;
  componentName?: string;
  userIntent?: string;
  tableContext?: boolean;
  simpleMode?: boolean;
  onSwitchTarget?: () => void;
  onAddIdHint?: () => void;
  onChangeBreakpoint?: () => void;
};

export function HandoffActionBar({
  reason,
  suggestedAction,
  hostId,
  file,
  line,
  componentName,
  userIntent = "edit selection in Nuvio",
  tableContext = false,
  simpleMode = false,
  onSwitchTarget,
  onAddIdHint,
  onChangeBreakpoint,
}: HandoffActionBarProps): ReactElement {
  const editorUrl = buildEditorUrl(file, line);

  const copyHandoff = (): void => {
    void copyTextToClipboard(
      buildFixHandoffClipboard({
        hostId,
        file,
        line,
        componentName,
        userIntent,
        reason,
        suggestedNextStep: tableContext
          ? MAKE_TABLE_EDITABLE_SNIPPET
          : "Add data-nuvio-id on the text element or pick a child target in the outline.",
      }),
    );
  };

  return (
    <div className="nuvio-stack-2">
      {simpleMode ? <p className="nuvio-text-xs nuvio-leading-snug">{reason}</p> : null}
      <div className="nuvio-row-wrap">
      {suggestedAction === "switchTarget" && onSwitchTarget ? (
        <button type="button" className="nuvio-button nuvio-button-primary" onClick={onSwitchTarget}>
          {simpleMode ? "Edit title instead" : "Pick text target"}
        </button>
      ) : null}
      {suggestedAction === "changeBreakpoint" && onChangeBreakpoint ? (
        <button type="button" className="nuvio-button" onClick={onChangeBreakpoint}>
          Check breakpoint
        </button>
      ) : null}
      {!simpleMode && suggestedAction === "addId" && onAddIdHint ? (
        <button type="button" className="nuvio-button" onClick={onAddIdHint}>
          How to add ids
        </button>
      ) : null}
      {(suggestedAction === "useHandoff" || suggestedAction === "addId") && (
        <button type="button" className="nuvio-button nuvio-button-primary" onClick={copyHandoff}>
          Copy Fix Prompt
        </button>
      )}
      {!simpleMode && editorUrl ? (
        <a
          href={editorUrl}
          className="nuvio-button nuvio-button-ghost"
          target="_blank"
          rel="noreferrer"
        >
          Open in editor
        </a>
      ) : null}
      </div>
    </div>
  );
}
