import type { BrandApplyAction } from "@nuvio/shared";
import type { BrandPresetDimension } from "@nuvio/shared";
import { captureOverlayEvent, type OverlayTelemetryEvent } from "./telemetry.js";

export type BrandTelemetryAction = BrandApplyAction;

export type BrandStyleFailureReason =
  | "preview_validation_failed"
  | "no_selection"
  | "no_patch_target"
  | "channel_not_ready"
  | "allowlist_rejected"
  | "brand_save_failed";

type BrandEventProps = {
  action?: BrandTelemetryAction;
  unsavedDraft?: boolean;
  errorCode?: BrandStyleFailureReason;
  category?: BrandPresetDimension;
};

function captureBrandEvent(event: OverlayTelemetryEvent, props?: BrandEventProps): void {
  captureOverlayEvent(event, props);
}

export function captureBrandKitOpened(): void {
  captureBrandEvent("brand_kit_opened");
}

export function captureBrandPresetChanged(category: BrandPresetDimension): void {
  captureBrandEvent("brand_preset_changed", { category });
}

export function captureBrandSaved(): void {
  captureBrandEvent("brand_saved");
}

export function captureBrandStylePreviewed(
  action: BrandTelemetryAction,
  unsavedDraft: boolean,
): void {
  captureBrandEvent("brand_style_previewed", { action, unsavedDraft });
}

export function captureBrandStyleApplied(): void {
  captureBrandEvent("brand_style_applied");
}

export function captureBrandBulkValidated(
  action: BrandTelemetryAction,
  _readyCount: number,
  hadFailures: boolean,
): void {
  captureBrandEvent("brand_bulk_validated", { action, unsavedDraft: hadFailures });
}

/** @deprecated Use {@link captureBrandBulkValidated}. Removed after one release. */
export function captureBrandBulkPreviewed(
  action: BrandTelemetryAction,
  readyCount: number,
  hadFailures: boolean,
): void {
  captureBrandBulkValidated(action, readyCount, hadFailures);
}

export function captureBrandBulkApplied(action: BrandTelemetryAction, _appliedCount: number): void {
  captureBrandEvent("brand_bulk_applied", { action });
}

export function captureBrandPagePreviewed(
  action: BrandTelemetryAction,
  _paintedCount: number,
): void {
  captureBrandEvent("brand_page_previewed", { action });
}

export function captureBrandCrossPageApplyStarted(action: BrandTelemetryAction): void {
  captureBrandEvent("brand_cross_page_apply_started", { action });
}

export function captureBrandStyleFailed(errorCode: BrandStyleFailureReason): void {
  captureBrandEvent("brand_style_failed", { errorCode });
}
