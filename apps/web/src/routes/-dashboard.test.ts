import { describe, expect, test } from "bun:test";

import { getDashboardPanelFromSearch, getDashboardSearchForPanel } from "./dashboard";

describe("dashboard execution route search", () => {
  test("lands on My Work when no execution panel is encoded", () => {
    expect(getDashboardPanelFromSearch({})).toBe("my_work");
  });

  test("encodes Team board navigation as route search state", () => {
    expect(getDashboardSearchForPanel({ kind: "team", teamId: "team-1" })).toEqual({
      work: "team",
      teamId: "team-1",
    });

    expect(getDashboardPanelFromSearch({ work: "team", teamId: "team-1" })).toEqual({
      kind: "team",
      teamId: "team-1",
    });
  });

  test("falls back to My Work for incomplete Team board search state", () => {
    expect(getDashboardPanelFromSearch({ work: "team" })).toBe("my_work");
  });
});
