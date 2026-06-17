import { Schema } from "effect";

export const ChurchProfileStep = Schema.TaggedStruct("churchProfile", {});
export const InitialTeamsStep = Schema.TaggedStruct("initialTeams", {});
export const FinishedStep = Schema.TaggedStruct("finished", {});

export const OnboardingStep = Schema.Union([ChurchProfileStep, InitialTeamsStep, FinishedStep]);
export type OnboardingStep = typeof OnboardingStep.Type;

export const onboardingStepLookup: Record<OnboardingStep["_tag"], number> = {
  churchProfile: 1,
  initialTeams: 2,
  finished: 3,
};

export const ONBOARDING_TOTAL_STEPS = 3;

export function getOnboardingStepTitle(step: OnboardingStep) {
  switch (step._tag) {
    case "churchProfile":
      return "Tell us about your Church";
    case "initialTeams":
      return "Review your initial Teams";
    case "finished":
      return "You're all set";
  }
}

type ResolveOnboardingStepInput = {
  readonly urlStep: OnboardingStep | undefined;
  readonly activeChurch: { readonly completedOnboarding: boolean } | null;
};

/**
 * Derives the current Onboarding Step from URL state plus live Church state.
 * The step is never stored; see
 * docs/adr/0008-persist-early-onboarding-with-derived-steps.md.
 */
export function resolveOnboardingStep({
  urlStep,
  activeChurch,
}: ResolveOnboardingStepInput): OnboardingStep {
  // A completed Church stays on the finished step for the brief window
  // before the redirectIfOnboarded guard navigates into the product.
  if (activeChurch?.completedOnboarding) {
    return { _tag: "finished" };
  }

  // Without an Active Church, no later step can render anything; stale URLs
  // always fall back to the church profile step.
  if (!activeChurch) {
    return { _tag: "churchProfile" };
  }

  // The Church exists: the church profile step is unreachable. Profile edits
  // happen post-onboarding in Church settings.
  if (!urlStep || urlStep._tag === "churchProfile") {
    return { _tag: "initialTeams" };
  }

  return urlStep;
}
