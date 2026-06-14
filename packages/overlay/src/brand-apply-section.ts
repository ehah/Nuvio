import type { BrandApplyAction, BrandConfig } from "@nuvio/shared";
import { brandConfigsEqual } from "@nuvio/shared";
import {
  isBrandBulkCategoryLocked,
  isBrandBulkCategoryValidationReady,
  type BrandBulkAppliedByAction,
  type BrandBulkProgress,
} from "./brand-bulk-session.js";

export type BrandApplySectionInput = {
  channelReady: boolean;
  loadState: "idle" | "loading" | "ready" | "error";
  dirty: boolean;
  action: BrandApplyAction;
  targetCount: number;
  saved: BrandConfig;
  appliedByAction: BrandBulkAppliedByAction;
  bulkPhase: BrandBulkProgress["phase"] | null;
  validatedAction: BrandApplyAction | null;
  validatedConfig: BrandConfig | null;
  brandBulkApplyReady: boolean;
};

export function isValidateBrandEnabled(input: BrandApplySectionInput): boolean {
  if (!input.channelReady || input.loadState !== "ready") {
    return false;
  }
  if (input.dirty) {
    return false;
  }
  if (input.targetCount === 0) {
    return false;
  }
  if (input.bulkPhase === "validating" || input.bulkPhase === "applying") {
    return false;
  }
  if (isBrandBulkCategoryLocked(input.action, input.saved, input.appliedByAction)) {
    return false;
  }
  if (
    isBrandBulkCategoryValidationReady(
      input.action,
      input.saved,
      input.validatedAction,
      input.validatedConfig,
      input.brandBulkApplyReady,
    )
  ) {
    return false;
  }
  return true;
}

export function isApplyBrandEnabled(input: BrandApplySectionInput): boolean {
  if (!input.channelReady || input.loadState !== "ready") {
    return false;
  }
  if (input.bulkPhase === "applying") {
    return false;
  }
  return isBrandBulkCategoryValidationReady(
    input.action,
    input.saved,
    input.validatedAction,
    input.validatedConfig,
    input.brandBulkApplyReady,
  );
}

export function validateBrandButtonTitle(input: BrandApplySectionInput): string | undefined {
  if (!input.channelReady) {
    return "Dev channel is not connected yet";
  }
  if (input.loadState !== "ready") {
    return "Loading brand…";
  }
  if (input.dirty) {
    return "Save Brand first to enable validate";
  }
  if (input.targetCount === 0) {
    return `No ${categoryPlural(input.action)} on this page`;
  }
  if (isBrandBulkCategoryLocked(input.action, input.saved, input.appliedByAction)) {
    return "Brand already applied on this page — change presets and save to validate again";
  }
  if (input.bulkPhase === "validating") {
    return "Validation in progress";
  }
  if (input.bulkPhase === "applying") {
    return "Apply in progress";
  }
  if (
    isBrandBulkCategoryValidationReady(
      input.action,
      input.saved,
      input.validatedAction,
      input.validatedConfig,
      input.brandBulkApplyReady,
    )
  ) {
    return "Validated — use Apply or change presets and save again";
  }
  return undefined;
}

export function applyBrandButtonTitle(input: BrandApplySectionInput): string | undefined {
  if (!input.channelReady) {
    return "Dev channel is not connected yet";
  }
  if (input.loadState !== "ready") {
    return "Loading brand…";
  }
  if (input.targetCount === 0) {
    return `No ${categoryPlural(input.action)} on this page`;
  }
  if (input.bulkPhase === "applying") {
    return "Applying brand…";
  }
  if (!input.brandBulkApplyReady) {
    return "Validate first to enable apply";
  }
  if (
    !isBrandBulkCategoryValidationReady(
      input.action,
      input.saved,
      input.validatedAction,
      input.validatedConfig,
      input.brandBulkApplyReady,
    )
  ) {
    return "Validate the active category on this page first";
  }
  return undefined;
}

export function formatApplyBrandSectionLead(action: BrandApplyAction, count: number): string {
  const label = categoryPlural(action);
  if (count === 0) {
    return `No ${label} on this page for the selected category.`;
  }
  return `Validate then apply your saved brand to ${count} ${label} on this page.`;
}

const CATEGORY_PLURAL: Record<BrandApplyAction, string> = {
  button: "buttons",
  card: "cards",
  heading: "headings",
  text: "text blocks",
  table: "tables",
  form: "forms",
  badge: "badges",
};

function categoryPlural(action: BrandApplyAction): string {
  return CATEGORY_PLURAL[action];
}

/** True when validate used saved config for a cross-page apply flow. */
export function shouldTrackCrossPageApply(
  saved: BrandConfig,
  draft: BrandConfig,
): boolean {
  return brandConfigsEqual(saved, draft);
}
