import { useEffect } from "react";

import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { useTaskByIdentifier } from "@/data/tasks/taskData.app";
import { useTeamsCollection } from "@/data/teams/teamsData.app";
import { useChurchUsersCollection } from "@/data/users/usersData.app";
import { useWorkflowStatusesCollection } from "@/data/workflows/workflowsData.app";
import {
  DetailItem,
  DetailSection,
  DetailSectionSkeleton,
} from "@/components/details-pane/details-components";
import { useChangeDetailsPaneId } from "@/components/details-pane/details-pane-helpers";
import { DetailsShell } from "@/components/details-pane/details-shell";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskDetailsPane({ identifier }: { readonly identifier: string }) {
  const { currentOrgOpt: activeChurch, loading: orgLoading } = useCurrentOrgOpt();
  const { taskOpt: task, loading: taskLoading } = useTaskByIdentifier({
    churchId: activeChurch?.id ?? null,
    identifier,
  });
  const teams = useTeamsCollection({ churchId: activeChurch?.id ?? null });
  const users = useChurchUsersCollection({ churchId: activeChurch?.id ?? null });
  const workflowStatuses = useWorkflowStatusesCollection({ churchId: activeChurch?.id ?? null });
  const team = teams.teamsCollection.find((candidate) => candidate.id === task?.teamId) ?? null;
  const assignee = users.usersCollection.find((candidate) => candidate.id === task?.assignedUserId);
  const workflowStatus = workflowStatuses.workflowStatusesCollection.find(
    (candidate) => candidate.id === task?.workflowStatusId,
  );
  const loading = orgLoading || taskLoading;
  const changeDetailsPaneId = useChangeDetailsPaneId();
  const canonicalIdentifier = task?.identifier ?? null;

  // URL normalization (ADR 0013): a lowercase or retired identifier resolves,
  // then the URL state is rewritten to the canonical current uppercase
  // identifier so the address bar always shows the canonical reference.
  useEffect(() => {
    if (canonicalIdentifier !== null && canonicalIdentifier !== identifier) {
      changeDetailsPaneId(canonicalIdentifier).forceNav();
    }
  }, [canonicalIdentifier, changeDetailsPaneId, identifier]);

  return (
    <DetailsShell
      topBarButtons={<p className="text-sm text-muted-foreground">Task details</p>}
      header={
        <>
          <h2 className="font-semibold text-lg">{task?.title ?? "Task"}</h2>
          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : task ? (
            // The Task Identifier (e.g. "PRD-48") is the user-facing
            // reference, not the database id (ADR 0013).
            <p className="text-sm text-muted-foreground">{task.identifier}</p>
          ) : null}
        </>
      }
      content={
        task ? (
          <DetailSection title="Overview">
            <DetailItem label="State" value={task.taskState} />
            <DetailItem
              label="Workflow Status"
              value={workflowStatus?.name ?? task.workflowStatusId}
            />
            <DetailItem label="Due Date" value={task.dueDate} />
            <DetailItem label="Team" value={team?.name ?? ""} />
            <DetailItem
              label="Assignee"
              value={assignee?.name ?? assignee?.email ?? "Unassigned"}
            />
          </DetailSection>
        ) : loading ? (
          <DetailSectionSkeleton rows={5} />
        ) : (
          // Graceful not-found pane state for unknown identifiers (ADR 0013).
          <p className="text-sm text-muted-foreground">
            No Task matches {identifier} in this Church.
          </p>
        )
      }
    />
  );
}
