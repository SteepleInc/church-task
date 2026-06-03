import { describe, expect, it } from "bun:test";

import {
  getChurchProfileSettingsDefaultValues,
  getSettingsSectionIds,
  normalizeOptionalChurchProfileValue,
  normalizeProfileName,
  settingsSections,
} from "@/routes/-settings";

describe("settings route sections", () => {
  it("keeps the copied sectioned settings structure focused on active Church Task areas", () => {
    expect(getSettingsSectionIds()).toEqual(["profile", "church", "members", "invites"]);
    expect(settingsSections.map((section) => section.label)).toEqual([
      "Profile",
      "Church",
      "Members",
      "Invitations",
    ]);
  });

  it("does not expose excluded PreachX settings sections", () => {
    expect(getSettingsSectionIds()).not.toContain("billing");
    expect(getSettingsSectionIds()).not.toContain("prompts");
  });

  it("normalizes profile names like the copied profile settings form", () => {
    expect(normalizeProfileName("  Jane   Q.   Member  ")).toBe("Jane Q. Member");
  });

  it("normalizes optional Church profile values before updating Better Auth custom fields", () => {
    expect(normalizeOptionalChurchProfileValue("  https://example.org  ")).toBe(
      "https://example.org",
    );
    expect(normalizeOptionalChurchProfileValue("   ")).toBeUndefined();
    expect(normalizeOptionalChurchProfileValue("none")).toBeUndefined();
  });

  it("builds editable Church profile defaults from the active Church", () => {
    expect(
      getChurchProfileSettingsDefaultValues({
        churchTimeZone: "America/Chicago",
        city: "Nashville",
        completedOnboarding: true,
        countryCode: "US",
        currentUserId: "user_1",
        id: "org_1",
        invitations: [],
        latitude: null,
        longitude: null,
        name: "Grace Church",
        role: "owner",
        size: null,
        slug: "grace-church",
        state: "TN",
        street: "123 Main Street",
        url: "https://example.org",
        zip: "37203",
      }),
    ).toMatchObject({
      churchTimeZone: "America/Chicago",
      city: "Nashville",
      countryCode: "US",
      name: "Grace Church",
      size: "none",
      state: "TN",
      street: "123 Main Street",
      url: "https://example.org",
      zip: "37203",
    });
  });
});
