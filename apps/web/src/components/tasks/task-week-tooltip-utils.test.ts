import { describe, expect, test } from "bun:test";

import {
  weekTooltipSummary,
  weekdaysLeftLabel,
  weekdaysRemaining,
} from "./task-week-tooltip-utils";

describe("weekdaysRemaining", () => {
  test("counts Mon–Fri across a full week from its Monday", () => {
    // 2026-06-22 is a Monday; the Week ends Sunday 2026-06-28.
    expect(weekdaysRemaining("2026-06-22", "2026-06-28")).toBe(5);
  });

  test("skips the weekend when counting from mid-week", () => {
    // Thu 2026-06-25 → Sun 2026-06-28 has Thu + Fri = 2 weekdays.
    expect(weekdaysRemaining("2026-06-25", "2026-06-28")).toBe(2);
  });

  test("returns 0 for a Week that has already ended", () => {
    expect(weekdaysRemaining("2026-06-29", "2026-06-28")).toBe(0);
  });

  test("returns 0 when starting on a weekend at the end of the Week", () => {
    expect(weekdaysRemaining("2026-06-27", "2026-06-28")).toBe(0);
  });

  test("returns 0 on unparseable dates", () => {
    expect(weekdaysRemaining("not-a-date", "2026-06-28")).toBe(0);
  });
});

describe("weekdaysLeftLabel", () => {
  test("pluralizes the day count", () => {
    expect(weekdaysLeftLabel("2026-06-22", "2026-06-28")).toBe("5 weekdays left");
  });

  test("uses the singular form for one day", () => {
    expect(weekdaysLeftLabel("2026-06-26", "2026-06-28")).toBe("1 weekday left");
  });

  test("is null once the Week has ended", () => {
    expect(weekdaysLeftLabel("2026-06-29", "2026-06-28")).toBeNull();
  });
});

describe("weekTooltipSummary", () => {
  test("joins completion, cue, and runway", () => {
    expect(
      weekTooltipSummary({
        scope: 48,
        completedPercentage: 25,
        relativeLabel: "Current",
        weekdaysLeft: "18 weekdays left",
      }),
    ).toBe("25% of 48 · Current · 18 weekdays left");
  });

  test("rounds the percentage", () => {
    expect(
      weekTooltipSummary({
        scope: 3,
        completedPercentage: 33.333,
        relativeLabel: null,
        weekdaysLeft: null,
      }),
    ).toBe("33% of 3");
  });

  test("drops the completion segment when no Tasks are scoped", () => {
    expect(
      weekTooltipSummary({
        scope: 0,
        completedPercentage: 0,
        relativeLabel: "Upcoming",
        weekdaysLeft: "4 weekdays left",
      }),
    ).toBe("Upcoming · 4 weekdays left");
  });

  test("returns an empty string when every segment is empty", () => {
    expect(
      weekTooltipSummary({
        scope: 0,
        completedPercentage: 0,
        relativeLabel: null,
        weekdaysLeft: null,
      }),
    ).toBe("");
  });
});
