import { describe, expect, test } from "bun:test";

import {
  getOnboardingStepTitle,
  ONBOARDING_TOTAL_STEPS,
  onboardingStepLookup,
} from "./onboardingState";

describe("onboarding step contract", () => {
  test("uses the two Church Task onboarding steps", () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(2);
    expect(onboardingStepLookup).toEqual({
      churchProfile: 1,
      initialTeams: 2,
    });
  });

  test("keeps the copied card titles adapted to Church Task", () => {
    expect(getOnboardingStepTitle({ _tag: "churchProfile" })).toBe("Tell us about your Church");
    expect(getOnboardingStepTitle({ _tag: "initialTeams" })).toBe("Review your initial Teams");
  });
});
