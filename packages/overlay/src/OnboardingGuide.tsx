import type { ReactElement } from "react";
import { GUIDE_CONTENT, type GuideContent } from "./selection-guides.js";
import type { OnboardingGuideId } from "./onboarding-storage.js";

export type OnboardingGuideProps = {
  guideId: OnboardingGuideId;
  onDismiss: () => void;
  /** Welcome uses a slightly larger card; contextual hints use compact banner. */
  variant?: "welcome" | "contextual";
};

function GuideBody({ content }: { content: GuideContent }): ReactElement {
  return (
    <>
      <p className="nuvio-font-medium nuvio-text-xs">{content.title}</p>
      <p className="nuvio-text-2xs nuvio-leading-snug nuvio-text-muted">{content.body}</p>
    </>
  );
}

export function OnboardingGuide({
  guideId,
  onDismiss,
  variant = "contextual",
}: OnboardingGuideProps): ReactElement {
  const content = GUIDE_CONTENT[guideId];

  if (variant === "welcome") {
    return (
      <section className="nuvio-card nuvio-stack-2 nuvio-onboarding-welcome">
        <GuideBody content={content} />
        <ol className="nuvio-onboarding-steps nuvio-text-2xs nuvio-text-muted">
          <li>Click an element on the page</li>
          <li>Choose what to change</li>
          <li>Preview Changes, then Apply to Code</li>
        </ol>
        <button type="button" className="nuvio-button nuvio-button-primary" onClick={onDismiss}>
          Got it
        </button>
      </section>
    );
  }

  return (
    <div className="nuvio-banner nuvio-banner--info nuvio-stack-2 nuvio-onboarding-contextual">
      <GuideBody content={content} />
      <button type="button" className="nuvio-button" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
