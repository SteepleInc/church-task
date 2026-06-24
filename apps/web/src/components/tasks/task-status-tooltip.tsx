import { useMemo, type ReactElement } from "react";

import { useActivitiesForEntityCollection } from "@/data/activities/activitiesData.app";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { WorkflowStatusIcon } from "./task-card-fields";
import type { TaskBoardTaskState, TaskBoardWorkflowStatus } from "./task-kanban-adapter";
import {
  computeTimeInStatus,
  formatStatusDuration,
  parseStatusChanges,
} from "./task-time-in-status-utils";

type StatusTimeTooltipProps = {
  readonly taskId: string;
  readonly churchId: string | null;
  readonly createdAt: number;
  readonly currentStatusId: string;
  readonly workflowStatuses: readonly TaskBoardWorkflowStatus[];
  // The visual status trigger to attach the hover to (the same node passed to
  // the status picker).
  readonly children: ReactElement;
  // When true (drag overlay / non-interactive) the rich tooltip is suppressed.
  readonly disabled?: boolean;
};

/**
 * Linear-style "Time in status" hover for a Task's status pill: a panel listing
 * how long the Task has spent in each Workflow Status, with the change-status
 * shortcut in the footer. The Activity log it reads from is queried lazily —
 * the inner panel only mounts (and so only subscribes) while the tooltip is
 * open, so resting the board never fans out a query per card.
 */
export function StatusTimeTooltip({
  taskId,
  churchId,
  createdAt,
  currentStatusId,
  workflowStatuses,
  children,
  disabled,
}: StatusTimeTooltipProps) {
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
        <StatusTimePanel
          churchId={churchId}
          createdAt={createdAt}
          currentStatusId={currentStatusId}
          taskId={taskId}
          workflowStatuses={workflowStatuses}
        />
      </TooltipContent>
    </Tooltip>
  );
}

function StatusTimePanel({
  taskId,
  churchId,
  createdAt,
  currentStatusId,
  workflowStatuses,
}: {
  readonly taskId: string;
  readonly churchId: string | null;
  readonly createdAt: number;
  readonly currentStatusId: string;
  readonly workflowStatuses: readonly TaskBoardWorkflowStatus[];
}) {
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
