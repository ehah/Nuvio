export const ONBOARDING_STORAGE_KEY = "nuvio:onboarding:v1";

export type OnboardingGuideId =
  | "welcome"
  | "first-selection"
  | "button-spacing"
  | "table-parts"
  | "chart-polish"
  | "layout-row";

type OnboardingState = {
  dismissed: string[];
};

function readState(): OnboardingState {
  if (typeof localStorage === "undefined") {
    return { dismissed: [] };
  }
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return { dismissed: [] };
    }
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return { dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [] };
  } catch {
    return { dismissed: [] };
  }
}

function writeState(state: OnboardingState): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function loadDismissedGuides(): ReadonlySet<string> {
  return new Set(readState().dismissed);
}

export function isGuideDismissed(id: OnboardingGuideId): boolean {
  return loadDismissedGuides().has(id);
}

export function dismissGuide(id: OnboardingGuideId): ReadonlySet<string> {
  const state = readState();
  if (!state.dismissed.includes(id)) {
    state.dismissed.push(id);
    writeState(state);
  }
  return new Set(state.dismissed);
}

export function resetOnboardingForTests(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
