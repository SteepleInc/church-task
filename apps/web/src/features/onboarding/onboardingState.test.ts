import { describe, expect, test } from "bun:test";

import {
  getOnboardingStepTitle,
  ONBOARDING_TOTAL_STEPS,
  onboardingStepLookup,
  resolveOnboardingStep,
} from "./onboardingState";

describe("onboarding step contract", () => {
  test("uses the three Church Work onboarding steps", () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(3);
    expect(onboardingStepLookup).toEqual({
      churchProfile: 1,
      initialTeams: 2,
      finished: 3,
    });
  });

  test("keeps the copied card titles adapted to Church Work", () => {
    expect(getOnboardingStepTitle({ _tag: "churchProfile" })).toBe("Tell us about your Church");
    expect(getOnboardingStepTitle({ _tag: "initialTeams" })).toBe("Review your initial Teams");
    expect(getOnboardingStepTitle({ _tag: "finished" })).toBe("You're all set");
  });
});

describe("resolveOnboardingStep", () => {
  const inOnboarding = { completedOnboarding: false };
  const completed = { completedOnboarding: true };

  test("a completed Church stays on the finished step until the guard redirects", () => {
    expect(
      resolveOnboardingStep({ urlStep: { _tag: "initialTeams" }, activeChurch: completed }),
    ).toEqual({ _tag: "finished" });
    expect(resolveOnboardingStep({ urlStep: undefined, activeChurch: completed })).toEqual({
      _tag: "finished",
    });
  });

  test("no Active Church always resolves to the church profile step", () => {
    expect(resolveOnboardingStep({ urlStep: undefined, activeChurch: null })).toEqual({
      _tag: "churchProfile",
    });
    expect(
      resolveOnboardingStep({ urlStep: { _tag: "initialTeams" }, activeChurch: null }),
    ).toEqual({ _tag: "churchProfile" });
    expect(resolveOnboardingStep({ urlStep: { _tag: "finished" }, activeChurch: null })).toEqual({
      _tag: "churchProfile",
    });
  });

  test("the church profile step is unreachable once the Church exists", () => {
    expect(
      resolveOnboardingStep({ urlStep: { _tag: "churchProfile" }, activeChurch: inOnboarding }),
    ).toEqual({ _tag: "initialTeams" });
  });

  test("later steps in the URL are honored while onboarding is incomplete", () => {
    expect(
      resolveOnboardingStep({ urlStep: { _tag: "initialTeams" }, activeChurch: inOnboarding }),
    ).toEqual({ _tag: "initialTeams" });
    expect(
      resolveOnboardingStep({ urlStep: { _tag: "finished" }, activeChurch: inOnboarding }),
    ).toEqual({ _tag: "finished" });
  });

  test("an incomplete Church with no URL step lands on the teams step", () => {
    expect(resolveOnboardingStep({ urlStep: undefined, activeChurch: inOnboarding })).toEqual({
      _tag: "initialTeams",
    });
  });
});
