import { Schema } from "effect";
import { normalizeTeamIdentifier } from "@church-task/domain";

import { FilterStateValueSchema } from "@/components/data-table-filter/core/types";
import { DetailsPaneParams } from "@/components/details-pane/details-pane-types";
import type { TaskViewSearch } from "@/components/tasks/task-view-options";
import { FilterKeys } from "@/shared/global-state";
import { lenientSearchField } from "@/shared/lenient-search";

export const WorkSearchSchema = Schema.Struct({
  taskState: lenientSearchField(Schema.Literals(["todo", "in_progress", "done", "canceled"])),
  workflowStatusId: lenientSearchField(Schema.NonEmptyString),
  "details-pane": lenientSearchField(DetailsPaneParams),
  [FilterKeys.Orgs]: lenientSearchField(FilterStateValueSchema),
  [FilterKeys.Users]: lenientSearchField(FilterStateValueSchema),
  [FilterKeys.Tasks]: lenientSearchField(FilterStateValueSchema),
  [FilterKeys.Templates]: lenientSearchField(FilterStateValueSchema),
});

/**
 * The `_org` layout search. Task routes layer `tab`/`view` on top of this via
 * their own route schemas (`MyWorkSearchSchema` / `ChurchWorkSearchSchema`).
 */
export type WorkPanelSearch = typeof WorkSearchSchema.Type;
export type WorkSearch = WorkPanelSearch & TaskViewSearch;

export const validateWorkSearch = Schema.toStandardSchemaV1(WorkSearchSchema);

export const decodeWorkSearch = Schema.decodeUnknownSync(WorkSearchSchema);

type TaskExecutionFilters = {
  readonly taskState?: WorkSearch["taskState"];
  readonly workflowStatusId?: string;
};

type WorkTeamSummary = {
  readonly id: string;
  readonly identifier: string;
  readonly previousIdentifiers?: readonly string[];
};

type WorkTeamMembershipSummary = {
  readonly teamId: string;
  readonly userId: string;
};

export function getUnavailableTeamBoardActions() {
  return [
    { panel: "my_work" as const, label: "Open My Work" },
    { panel: "our_work" as const, label: "Open Our Work" },
  ];
}

function getWorkFilterSearch(search: WorkSearch): WorkPanelSearch {
  return {
    ...(search.taskState ? { taskState: search.taskState } : {}),
    ...(search.workflowStatusId ? { workflowStatusId: search.workflowStatusId } : {}),
    ...(search["details-pane"] && search["details-pane"].length > 0
      ? { "details-pane": search["details-pane"] }
      : {}),
  };
}

/**
 * The search carried when switching between task surfaces. View Tabs and View
 * Options are intentionally dropped: they belong to the surface they were set
 * on (the team route retains them across `$teamId` switches separately).
 */
export function getWorkSearchForPanel(currentSearch: WorkSearch = {}): WorkPanelSearch {
  return getWorkFilterSearch(currentSearch);
}

export function getWorkSearchForExecutionFilters(
  search: WorkSearch,
  filters: TaskExecutionFilters,
): WorkSearch {
  return {
    ...getWorkFilterSearch(search),
    taskState: filters.taskState,
    workflowStatusId: filters.workflowStatusId,
  };
}

export function getMemberTeams<Team extends WorkTeamSummary>(
  teams: readonly Team[],
  memberships: readonly WorkTeamMembershipSummary[],
  currentUserId: string | null,
): Team[] {
  const currentUserTeamIds = new Set(
    memberships
      .filter((membership) => membership.userId === currentUserId)
      .map((membership) => membership.teamId),
  );

  return teams.filter((team) => currentUserTeamIds.has(team.id));
}

export function resolveTeamByRouteIdentifier<Team extends WorkTeamSummary>(
  teams: readonly Team[],
  routeIdentifier: string,
): Team | null {
  const identifier = normalizeTeamIdentifier(routeIdentifier);

  return (
    teams.find((team) => normalizeTeamIdentifier(team.identifier) === identifier) ??
    teams.find((team) =>
      (team.previousIdentifiers ?? []).some(
        (previousIdentifier) => normalizeTeamIdentifier(previousIdentifier) === identifier,
      ),
    ) ??
    null
  );
}
