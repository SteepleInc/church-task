import { describe, expect, test } from "bun:test";

import { getOrgSwitchTarget, getSessionOrgSwitchTarget } from "./org-routing";

describe("Org switching route behavior", () => {
  test("routes completed Churches to My Work", () => {
    expect(getOrgSwitchTarget({ completedOnboarding: true })).toBe("/my-work");
  });

  test("routes incomplete Churches to onboarding", () => {
    expect(getOrgSwitchTarget({ completedOnboarding: false })).toBe("/onboarding");
  });

  test("routes completed sessions to My Work", () => {
    expect(getSessionOrgSwitchTarget({ orgCompletedOnboarding: true })).toBe("/my-work");
  });

  test("routes incomplete or orgless sessions to onboarding", () => {
    expect(getSessionOrgSwitchTarget({ orgCompletedOnboarding: false })).toBe("/onboarding");
    expect(getSessionOrgSwitchTarget({ orgCompletedOnboarding: null })).toBe("/onboarding");
    expect(getSessionOrgSwitchTarget({})).toBe("/onboarding");
  });
});
