import type { ReactElement } from "react";

export type SimpleModeActionBarProps = {
  previewLabel: string;
  applyLabel: string;
  previewBusy: boolean;
  previewDisabled: boolean;
  applyDisabled: boolean;
  undoDisabled: boolean;
  hasStagedOps: boolean;
  previewReady: boolean;
  humanPreviewBlock: string | null;
  structuralPreviewActive: boolean;
  onPreview: () => void;
  onApply: () => void;
  onUndo: () => void;
};

export function SimpleModeActionBar({
  previewLabel,
  applyLabel,
  previewBusy,
  previewDisabled,
  applyDisabled,
  undoDisabled,
  hasStagedOps,
  previewReady,
  humanPreviewBlock,
  structuralPreviewActive,
  onPreview,
  onApply,
  onUndo,
}: SimpleModeActionBarProps): ReactElement {
  const pendingLabel = hasStagedOps
    ? previewReady
      ? "Changes to apply"
      : "1 pending change"
    : "No pending changes";

  return (
    <section className="nuvio-card nuvio-card--actions nuvio-stack-2">
      {previewBusy ? (
        <p className="nuvio-banner nuvio-banner--info nuvio-text-2xs">Checking your changes…</p>
      ) : (
        <p className="nuvio-pending-label">{pendingLabel}</p>
      )}
      {!structuralPreviewActive && previewReady && humanPreviewBlock ? (
        <div className="nuvio-preview-box nuvio-preview-box--compact">
          <p className="nuvio-preview-box-body">{humanPreviewBlock}</p>
        </div>
      ) : null}
      <div className="nuvio-action-stack">
        <button
          type="button"
          disabled={previewDisabled}
          className="nuvio-button nuvio-button--block"
          onClick={onPreview}
        >
          {previewLabel}
        </button>
        <button
          type="button"
          disabled={applyDisabled}
          className="nuvio-button nuvio-button-primary nuvio-button--block"
          onClick={onApply}
        >
          {applyLabel}
        </button>
        <button
          type="button"
          disabled={undoDisabled}
          className="nuvio-button nuvio-button-ghost nuvio-button--block"
          onClick={onUndo}
        >
          Undo
        </button>
      </div>
    </section>
  );
}
