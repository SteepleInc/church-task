import { describe, expect, test } from "bun:test";

const routeSource = await Bun.file(new URL("./route.tsx", import.meta.url)).text();
const onboardingSource = await Bun.file(new URL("./onboarding.tsx", import.meta.url)).text();

describe("onboarding PreachX fidelity guards", () => {
  test("removes the mismatched generated onboarding chrome", () => {
    expect(routeSource).not.toContain("Next up");
    expect(routeSource).not.toContain("top-4 right-4 hidden flex-row items-center gap-2 md:flex");
    expect(onboardingSource).not.toContain("Step 1 of 2");
    expect(onboardingSource).not.toContain("Step 2 of 2");
  });

  test("keeps manual Church profile details behind an explicit edit affordance", () => {
    expect(onboardingSource).toContain("Find Your Church");
    expect(onboardingSource).toContain("Edit Details");
    expect(onboardingSource).toContain("showProfileDetails ?");
    expect(onboardingSource).toContain("Street");
  });

  test("uses the copied PreachX preachers-step shape for initial Teams", () => {
    expect(onboardingSource).toContain("<CardAdornment");
    expect(onboardingSource).toContain("<CardAction");
    expect(onboardingSource).toContain("<ActionRow");
    expect(onboardingSource).toContain("Initial Church Task Team");
  });
});
