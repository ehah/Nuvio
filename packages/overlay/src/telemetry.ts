import { posthog } from "posthog-js";
import { NUVIO_POSTHOG_TOKEN } from "./nuvio-posthog-token.js";

const POSTHOG_HOST = "https://us.i.posthog.com";

export type OverlayTelemetryEvent =
  | "overlay_connected"
  | "first_selection"
  | "preview_changes"
  | "apply_to_code"
  | "apply_failed"
  | "tag_element_started"
  | "tag_element_completed"
  | "tag_element_failed"
  | "brand_kit_opened"
  | "brand_preset_changed"
  | "brand_saved"
  | "brand_style_previewed"
  | "brand_style_applied"
  | "brand_bulk_validated"
  | "brand_bulk_applied"
  | "brand_page_previewed"
  | "brand_cross_page_apply_started"
  | "brand_style_failed";

export type TagElementFailureReason =
  | "duplicate_id"
  | "invalid_id"
  | "node_not_found"
  | "already_tagged"
  | "write_error"
  | "tag_error";

export type ApplyFailureReason =
  | "duplicate_id"
  | "no_patch_target"
  | "unsupported_classname"
  | "apply_error";

type OverlayEventProps = {
  reason?: ApplyFailureReason | TagElementFailureReason;
  action?: string;
  unsavedDraft?: boolean;
  errorCode?: string;
  category?: string;
};

let initialized = false;
let firstSelectionSent = false;
let overlayConnectedSent = false;

function posthogToken(): string {
  return NUVIO_POSTHOG_TOKEN;
}

function tokenIsConfigured(token: string): boolean {
  return Boolean(token && token.startsWith("phc_"));
}

export function isOverlayTelemetryOptedOut(flags: {
  localStorageTelemetry: string | null;
  viteTelemetry: string | undefined;
}): boolean {
  return flags.localStorageTelemetry === "0" || flags.viteTelemetry === "0";
}

export function isOverlayTelemetryEnabled(): boolean {
  try {
    const localStorageTelemetry =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("nuvio.telemetry")
        : null;
    const env = import.meta as ImportMeta & {
      env?: { VITE_NUVIO_TELEMETRY?: string };
    };
    if (
      isOverlayTelemetryOptedOut({
        localStorageTelemetry,
        viteTelemetry: env.env?.VITE_NUVIO_TELEMETRY,
      })
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function ensureInitialized(): boolean {
  if (!isOverlayTelemetryEnabled()) return false;
  const token = posthogToken();
  if (!tokenIsConfigured(token)) return false;
  if (!initialized) {
    const debug =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("nuvio.telemetry.debug") === "1";
    posthog.init(token, {
      api_host: POSTHOG_HOST,
      ui_host: "https://us.posthog.com",
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      persistence: "localStorage",
      debug,
    });
    initialized = true;
  }
  return true;
}

export function mapApplyFailureReason(
  errorCode: string | undefined,
  options?: { duplicateIdsActive?: boolean },
): ApplyFailureReason {
  if (options?.duplicateIdsActive && errorCode === "unknown_id") {
    return "duplicate_id";
  }
  if (errorCode === "unknown_id" || errorCode === "host_not_found") {
    return "no_patch_target";
  }
  if (errorCode === "patch_rejected") {
    return "unsupported_classname";
  }
  return "apply_error";
}

export function captureOverlayEvent(
  event: OverlayTelemetryEvent,
  props?: OverlayEventProps,
): void {
  try {
    if (!ensureInitialized()) return;
    const payload: Record<string, string | boolean> = {};
    if (props?.reason) {
      payload.reason = props.reason;
    }
    if (props?.action) {
      payload.action = props.action;
    }
    if (props?.unsavedDraft !== undefined) {
      payload.unsavedDraft = props.unsavedDraft;
    }
    if (props?.errorCode) {
      payload.errorCode = props.errorCode;
    }
    if (props?.category) {
      payload.category = props.category;
    }
    posthog.capture(event, Object.keys(payload).length > 0 ? payload : undefined);
  } catch {
    // never break overlay
  }
}

export function captureOverlayConnected(): void {
  if (overlayConnectedSent) return;
  overlayConnectedSent = true;
  captureOverlayEvent("overlay_connected");
}

export function captureFirstSelection(): void {
  if (firstSelectionSent) return;
  firstSelectionSent = true;
  captureOverlayEvent("first_selection");
}

export function mapTagElementFailureReason(errorCode: string | undefined): TagElementFailureReason {
  if (errorCode === "duplicate_id") return "duplicate_id";
  if (errorCode === "invalid_id") return "invalid_id";
  if (errorCode === "node_not_found" || errorCode === "parse_error") return "node_not_found";
  if (errorCode === "already_tagged") return "already_tagged";
  if (errorCode === "write_error" || errorCode === "read_error") return "write_error";
  return "tag_error";
}

export function captureTagElementStarted(): void {
  captureOverlayEvent("tag_element_started");
}

export function captureTagElementCompleted(): void {
  captureOverlayEvent("tag_element_completed");
}

export function captureTagElementFailed(errorCode: string | undefined): void {
  captureOverlayEvent("tag_element_failed", {
    reason: mapTagElementFailureReason(errorCode),
  });
}

export function captureApplyFailed(
  errorCode: string | undefined,
  options?: { duplicateIdsActive?: boolean },
): void {
  captureOverlayEvent("apply_failed", {
    reason: mapApplyFailureReason(errorCode, options),
  });
}

/** Test-only reset of module state. */
export function __resetOverlayTelemetryForTests(): void {
  initialized = false;
  firstSelectionSent = false;
  overlayConnectedSent = false;
}
