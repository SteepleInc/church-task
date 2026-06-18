export type WeekProgressTaskState = "todo" | "in_progress" | "done" | "canceled";
export type WeekProgressEstimate = "xs" | "s" | "m" | "l" | "xl";
export type WeekProgressPriority = "no_priority" | "urgent" | "high" | "medium" | "low";

export type WeekProgressTask = {
  readonly id: string;
  readonly teamId: string;
  readonly assignedUserId?: string | null;
  readonly taskState: WeekProgressTaskState;
  readonly estimate?: WeekProgressEstimate | null;
  readonly labelIds?: readonly string[];
  readonly priority?: WeekProgressPriority | null;
};

export type WeekProgressMeta = {
  readonly assignees: readonly { readonly id: string; readonly label: string }[];
  readonly labels: readonly {
    readonly id: string;
    readonly name: string;
    readonly color?: string | null;
  }[];
  readonly teams: readonly { readonly id: string; readonly name: string }[];
};

export type WeekProgressBreakdownKey = "assignees" | "labels" | "priority" | "estimate" | "teams";

/**
 * How a breakdown row's leading marker should be rendered. Lets the panel show
 * the same priority icons, label dots, and avatars used across the Task surface
 * without re-deriving identity in the view layer.
 */
export type WeekProgressRowVisual =
  | { readonly kind: "assignee"; readonly userId: string | null }
  | { readonly kind: "label"; readonly name: string; readonly color: string | null }
  | { readonly kind: "priority"; readonly priority: WeekProgressPriority }
  | { readonly kind: "estimate"; readonly estimate: WeekProgressEstimate | "no_estimate" }
  | { readonly kind: "team"; readonly name: string };

export type WeekProgressBreakdownRow = {
  readonly id: string;
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
  readonly visual: WeekProgressRowVisual;
};

export type WeekProgressData = {
  readonly summary: {
    readonly scope: number;
    readonly started: number;
    readonly completed: number;
  };
  readonly startedPercentage: number;
  readonly completedPercentage: number;
  readonly breakdowns: Record<
    WeekProgressBreakdownKey,
    { readonly label: string; readonly rows: readonly WeekProgressBreakdownRow[] }
  >;
};

const PRIORITY_LABELS: Record<WeekProgressPriority, string> = {
  no_priority: "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const ESTIMATE_LABELS: Record<WeekProgressEstimate | "no_estimate", string> = {
  no_estimate: "No estimate",
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

const PRIORITY_ORDER = ["urgent", "high", "medium", "low", "no_priority"] as const;
const ESTIMATE_ORDER = ["xs", "s", "m", "l", "xl", "no_estimate"] as const;

const ORDER: Record<WeekProgressBreakdownKey, readonly string[]> = {
  assignees: [],
  labels: [],
  priority: PRIORITY_ORDER,
  estimate: ESTIMATE_ORDER,
  teams: [],
};

type WeekProgressEstimateBucket = WeekProgressEstimate | "no_estimate";
type WeekProgressCounts = {
  readonly assignees: Map<string, number>;
  readonly labels: Map<string, number>;
  readonly priority: Map<WeekProgressPriority, number>;
  readonly estimate: Map<WeekProgressEstimateBucket, number>;
  readonly teams: Map<string, number>;
};

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : (count / total) * 100;
}

function rowComparator(order: readonly string[]) {
  return (left: WeekProgressBreakdownRow, right: WeekProgressBreakdownRow) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (
        (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      );
    }
    return right.count - left.count || left.label.localeCompare(right.label);
  };
}

function rowsFromCounts<Id extends string>(args: {
  readonly counts: ReadonlyMap<Id, number>;
  readonly labels: ReadonlyMap<Id, string> | ReadonlyMap<string, string>;
  readonly scope: number;
  readonly order?: readonly string[];
  readonly visual: (id: Id, label: string) => WeekProgressRowVisual;
}): readonly WeekProgressBreakdownRow[] {
  return [...args.counts.entries()]
    .map(([id, count]) => {
      const label = args.labels.get(id) ?? id;
      return {
        id,
        label,
        count,
        percentage: percentage(count, args.scope),
        visual: args.visual(id, label),
      };
    })
    .filter((row) => row.count > 0)
    .sort(rowComparator(args.order ?? []));
}

function increment<Id extends string>(counts: Map<Id, number>, id: Id) {
  counts.set(id, (counts.get(id) ?? 0) + 1);
}

export function buildWeekProgressData(args: {
  readonly tasks: readonly WeekProgressTask[];
  readonly meta: WeekProgressMeta;
}): WeekProgressData {
  const scopedTasks = args.tasks.filter((task) => task.taskState !== "canceled");
  const scope = scopedTasks.length;
  const started = scopedTasks.filter(
    (task) => task.taskState === "in_progress" || task.taskState === "done",
  ).length;
  const completed = scopedTasks.filter((task) => task.taskState === "done").length;

  const assigneeLabels = new Map(
    args.meta.assignees.map((assignee) => [assignee.id, assignee.label]),
  );
  assigneeLabels.set("unassigned", "Unassigned");
  const labelLabels = new Map(args.meta.labels.map((label) => [label.id, label.name]));
  labelLabels.set("no_label", "No label");
  const labelColors = new Map(args.meta.labels.map((label) => [label.id, label.color ?? null]));
  const teamLabels = new Map(args.meta.teams.map((team) => [team.id, team.name]));
  const priorityLabels = new Map(Object.entries(PRIORITY_LABELS));
  const estimateLabels = new Map(Object.entries(ESTIMATE_LABELS));

  const counts: WeekProgressCounts = {
    assignees: new Map<string, number>(),
    labels: new Map<string, number>(),
    priority: new Map<WeekProgressPriority, number>(),
    estimate: new Map<WeekProgressEstimateBucket, number>(),
    teams: new Map<string, number>(),
  };

  for (const task of scopedTasks) {
    increment(counts.assignees, task.assignedUserId ?? "unassigned");
    if (task.labelIds?.length)
      for (const labelId of task.labelIds) increment(counts.labels, labelId);
    else increment(counts.labels, "no_label");
    increment(counts.priority, task.priority ?? "no_priority");
    increment(counts.estimate, task.estimate ?? "no_estimate");
    increment(counts.teams, task.teamId);
  }

  return {
    summary: { scope, started, completed },
    startedPercentage: percentage(started, scope),
    completedPercentage: percentage(completed, scope),
    breakdowns: {
      assignees: {
        label: "Assignees",
        rows: rowsFromCounts({
          counts: counts.assignees,
          labels: assigneeLabels,
          scope,
          order: ORDER.assignees,
          visual: (id) => ({
            kind: "assignee",
            userId: id === "unassigned" ? null : id,
          }),
        }),
      },
      labels: {
        label: "Labels",
        rows: rowsFromCounts({
          counts: counts.labels,
          labels: labelLabels,
          scope,
          order: ORDER.labels,
          visual: (id, label) => ({
            kind: "label",
            name: label,
            color: id === "no_label" ? null : (labelColors.get(id) ?? null),
          }),
        }),
      },
      priority: {
        label: "Priority",
        rows: rowsFromCounts<WeekProgressPriority>({
          counts: counts.priority,
          labels: priorityLabels,
          scope,
          order: ORDER.priority,
          visual: (priority) => ({
            kind: "priority",
            priority,
          }),
        }),
      },
      estimate: {
        label: "Estimate",
        rows: rowsFromCounts<WeekProgressEstimateBucket>({
          counts: counts.estimate,
          labels: estimateLabels,
          scope,
          order: ORDER.estimate,
          visual: (estimate) => ({
            kind: "estimate",
            estimate,
          }),
        }),
      },
      teams: {
        label: "Teams",
        rows: rowsFromCounts({
          counts: counts.teams,
          labels: teamLabels,
          scope,
          order: ORDER.teams,
          visual: (_id, label) => ({ kind: "team", name: label }),
        }),
      },
    },
  };
}
