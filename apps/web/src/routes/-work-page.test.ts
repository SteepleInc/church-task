import { describe, expect, test } from "bun:test";

import {
  decodeWorkSearch,
  getWorkSearchForExecutionFilters,
  getWorkSearchForPanel,
  getMemberTeams,
  getUnavailableTeamBoardActions,
  resolveTeamByRouteIdentifier,
} from "./-work-page-utils";

describe("work page execution route search", () => {
  test("uses completed session org state instead of gating on active org loading", async () => {
    const source = await Bun.file(new URL("./-work-page.tsx", import.meta.url)).text();

    expect(source).toContain("sessionHasCompletedActiveChurch");
    expect(source).toContain("activeChurchLoading && !sessionHasCompletedActiveChurch");
    expect(source).toContain("hasActiveChurch || sessionHasCompletedActiveChurch");
    expect(source).toContain("activeChurch?.id ?? sessionRouting?.activeOrganizationId ?? null");
    expect(source).toContain("activeChurch?.currentUserId ?? sessionData?.user?.id ?? null");
  });

  test("names the shared surface as WorkPage and does not expose stale settings panels", async () => {
    const source = await Bun.file(new URL("./-work-page.tsx", import.meta.url)).text();

    expect(source).toContain("export function WorkPage");
    expect(source).toContain("type ActiveWorkPanel");
    expect(source).not.toContain("DashboardPage");
    expect(source).not.toContain("ActiveDashboardPanel");
    expect(source).not.toContain("ActiveChurchSettings");
    expect(source).not.toContain("WorkflowSettingsCard");
    expect(source).not.toContain('activePanel === "settings"');
  });

  test("keeps page identity out of work page search state", () => {
    expect(
      decodeWorkSearch({
        work: "team",
        teamId: "team-1",
        taskState: "todo",
        workflowStatusId: "status-1",
      }),
    ).toEqual({
      taskState: "todo",
      workflowStatusId: "status-1",
    });
  });

  test("drops invalid temporary execution filters", () => {
    expect(
      decodeWorkSearch({
        taskState: "blocked",
        workflowStatusId: "",
      }),
    ).toEqual({
      taskState: undefined,
      workflowStatusId: undefined,
    });
  });

  test("preserves temporary execution filters while switching execution pages", () => {
    expect(
      getWorkSearchForPanel({ taskState: "in_progress", workflowStatusId: "status-1" }),
    ).toEqual({
      taskState: "in_progress",
      workflowStatusId: "status-1",
    });

    expect(getWorkSearchForPanel({ taskState: "done" })).toEqual({
      taskState: "done",
    });
  });

  test("does not carry View Tabs or View Options between My Work and Our Work by default", () => {
    expect(
      getWorkSearchForPanel({
        tab: "created",
        view: { mode: "list" },
        taskState: "todo",
      }),
    ).toEqual({ taskState: "todo" });
  });

  test("preserves details pane state while switching execution pages", () => {
    expect(
      getWorkSearchForPanel({
        taskState: "todo",
        "details-pane": [{ _tag: "task", id: "task-1", tab: "details" }],
      }),
    ).toEqual({
      taskState: "todo",
      "details-pane": [{ _tag: "task", id: "task-1", tab: "details" }],
    });
  });

  test("encodes temporary execution filters as route search state", () => {
    expect(
      getWorkSearchForExecutionFilters(
        {},
        { taskState: "in_progress", workflowStatusId: "status-1" },
      ),
    ).toEqual({
      taskState: "in_progress",
      workflowStatusId: "status-1",
    });

    expect(
      getWorkSearchForExecutionFilters({ taskState: "done", workflowStatusId: "status-1" }, {}),
    ).toEqual({ taskState: undefined, workflowStatusId: undefined });
  });

  test("does not encode Team board identity while changing temporary execution filters", () => {
    expect(
      getWorkSearchForExecutionFilters(
        { taskState: "todo" },
        { taskState: "done", workflowStatusId: "status-1" },
      ),
    ).toEqual({
      taskState: "done",
      workflowStatusId: "status-1",
    });
  });

  test("offers execution route recovery actions for unavailable Team boards", () => {
    expect(getUnavailableTeamBoardActions()).toEqual([
      { panel: "my_work", label: "Open My Work" },
      { panel: "our_work", label: "Open Our Work" },
    ]);
  });

  test("lists only current User Team Memberships in Team navigation", () => {
    const teams = [
      { id: "team-1", identifier: "HOS", name: "Hospitality" },
      { id: "team-2", identifier: "PRO", name: "Production" },
      { id: "team-3", identifier: "CAR", name: "Care" },
    ];

    expect(
      getMemberTeams(
        teams,
        [
          { teamId: "team-1", userId: "current-user" },
          { teamId: "team-2", userId: "other-user" },
        ],
        "current-user",
      ),
    ).toEqual([{ id: "team-1", identifier: "HOS", name: "Hospitality" }]);
  });

  test("resolves Team routes by current identifier case-insensitively", () => {
    const teams = [
      { id: "team-1", identifier: "PRD", name: "Production", previousIdentifiers: [] },
    ];

    expect(resolveTeamByRouteIdentifier(teams, "prd")).toBe(teams[0]);
  });

  test("falls back to previous Team identifiers", () => {
    const teams = [
      { id: "team-1", identifier: "PRD", name: "Production", previousIdentifiers: ["OLD"] },
    ];

    expect(resolveTeamByRouteIdentifier(teams, "old")).toBe(teams[0]);
  });

  test("current Team identifiers beat previous identifier aliases", () => {
    const teams = [
      { id: "team-1", identifier: "NEW", name: "Production", previousIdentifiers: ["OLD"] },
      { id: "team-2", identifier: "OLD", name: "Outreach", previousIdentifiers: [] },
    ];

    expect(resolveTeamByRouteIdentifier(teams, "old")).toBe(teams[1]);
  });

  test("returns null for unknown Team route identifiers", () => {
    expect(
      resolveTeamByRouteIdentifier(
        [{ id: "team-1", identifier: "PRD", name: "Production", previousIdentifiers: [] }],
        "missing",
      ),
    ).toBeNull();
  });
});
