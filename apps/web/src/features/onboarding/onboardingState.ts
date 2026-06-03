import { Schema } from "effect";

export const ChurchProfileStep = Schema.TaggedStruct("churchProfile", {});
export const InitialTeamsStep = Schema.TaggedStruct("initialTeams", {});

export const OnboardingStep = Schema.Union(ChurchProfileStep, InitialTeamsStep);
export type OnboardingStep = typeof OnboardingStep.Type;

export const onboardingStepLookup: Record<OnboardingStep["_tag"], number> = {
  churchProfile: 1,
  initialTeams: 2,
};

export const ONBOARDING_TOTAL_STEPS = 2;

export function getOnboardingStepTitle(step: OnboardingStep) {
  switch (step._tag) {
    case "churchProfile":
      return "Tell us about your Church";
    case "initialTeams":
      return "Review your initial Teams";
  }
}
