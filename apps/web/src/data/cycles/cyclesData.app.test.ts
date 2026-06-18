import { describe, expect, test } from "bun:test";

import { getWeekDisplayName } from "./cyclesData.app";

describe("Week display names", () => {
  test("uses date range when a Week has no custom name", () => {
    expect(getWeekDisplayName({ endDate: "2026-04-05", name: null, startDate: "2026-03-30" })).toBe(
      "2026-03-30 – 2026-04-05",
    );
  });

  test("uses the custom Church-wide Week name when present", () => {
    expect(
      getWeekDisplayName({
        endDate: "2026-04-05",
        name: "Easter follow-up Week",
        startDate: "2026-03-30",
      }),
    ).toBe("Easter follow-up Week");
  });
});
