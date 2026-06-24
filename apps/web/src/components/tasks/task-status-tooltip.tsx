import { useMemo, type ReactElement } from "react";

import { useActivitiesForEntityCollection } from "@/data/activities/activitiesData.app";
import { useTasksCollection } from "@/data/tasks/tasksData.app";
import { useChurchId } from "@/data/useChurchId";
import { useWorkflowStatusesCollection } from "@/data/workflows/workflowsData.app";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { WorkflowStatusIcon } from "./task-card-fields";
import type { TaskBoardTaskState } from "./task-kanban-adapter";
import {
  computeTimeInStatus,
  formatStatusDuration,
  parseStatusChanges,
} from "./task-time-in-status-utils";

type StatusTimeTooltipProps = {
  // The Task whose status history this hover summarizes; everything else
  // (creation time, Workflow Statuses, Activity log) is resolved from Zero.
  readonly taskId: string;
  // The visual status trigger to attach the hover to (the same node passed to
  // the status picker).
  readonly children: ReactElement;
  // When true (drag overlay / non-interactive) the rich tooltip is suppressed.
  readonly disabled?: boolean;
};

/**
 * Linear-style "Time in status" hover for a Task's status pill: a panel listing
 * how long the Task has spent in each Workflow Status, with the change-status
 * shortcut in the footer. Self-contained — it resolves the Task's creation
 * time, the Church's Workflow Statuses, and the Activity log from Zero by
 * `taskId` alone (all Church-scoped or lazily mounted, so they collapse to one
 * subscription each). The inner panel only mounts while the tooltip is open, so
 * resting the board never fans out a query per card.
 */
export function StatusTimeTooltip({ taskId, children, disabled }: StatusTimeTooltipProps) {
  if (disabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        // A richer multi-row panel rather than the single-line action chip; the
        // light surface + ring come from TooltipContent.
        className="flex w-56 flex-col items-stretch gap-0 p-0 text-sm font-normal"
        sideOffset={6}
      >
        <StatusTimePanel taskId={taskId} />
      </TooltipContent>
    </Tooltip>
  );
}

function StatusTimePanel({ taskId }: { readonly taskId: string }) {
  const churchId = useChurchId();
  const { tasksCollection } = useTasksCollection({ churchId, currentUserId: null });
  const { workflowStatusesCollection } = useWorkflowStatusesCollection({ churchId });
  const task = tasksCollection.find((candidate) => candidate.id === taskId);
  const createdAt = task?.createdAt ?? 0;
  const currentStatusId = task?.workflowStatusId ?? "";
  const workflowStatuses = workflowStatusesCollection;

  const { collection, loading } = useActivitiesForEntityCollection({
    churchId,
    entityType: "task",
    entityId: taskId,
  });

  const statusById = useMemo(() => {
    const map = new Map<string, { name: string; taskState: TaskBoardTaskState }>();
    for (const status of workflowStatuses) {
      map.set(status.id, { name: status.name, taskState: status.taskState });
    }
    return map;
  }, [workflowStatuses]);

  const rows = useMemo(() => {
    const changes = parseStatusChanges(collection);
    return computeTimeInStatus({
      createdAt,
      currentStatusId,
      changes,
      now: Date.now(),
    });
    // `collection` identity changes as the query settles; recompute then.
  }, [collection, createdAt, currentStatusId]);

  return (
    <div className="flex flex-col">
      <p className="px-2.5 pt-2 pb-1 font-medium text-muted-foreground text-xs">Time in status</p>
      <div className="flex flex-col px-1 pb-1">
        {loading && rows.length === 0 ? (
          <p className="px-1.5 py-1 text-muted-foreground text-xs">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-1.5 py-1 text-muted-foreground text-xs">No status history yet.</p>
        ) : (
          rows.map((row) => {
            const status = statusById.get(row.statusId);
            return (
              <div
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm"
                key={row.statusId}
              >
                <WorkflowStatusIcon taskState={status?.taskState ?? "todo"} />
                <span className="min-w-0 flex-1 truncate">{status?.name ?? "Unknown status"}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatStatusDuration(row.durationMs)}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-between border-t px-2.5 py-1.5 text-muted-foreground text-xs">
        <span>Change status</span>
        <Kbd>S</Kbd>
      </div>
    </div>
  );
}
