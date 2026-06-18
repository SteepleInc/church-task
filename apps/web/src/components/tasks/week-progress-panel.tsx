import { Users, X } from "lucide-react";
import { useMemo } from "react";

import { TeamAvatar } from "@/components/avatars/teamAvatar";
import { UserAvatar } from "@/components/avatars/userAvatar";
import {
  getEstimateMeta,
  getPriorityMeta,
  labelDotClassName,
} from "@/components/tasks/task-card-fields";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  buildWeekProgressData,
  type WeekProgressBreakdownKey,
  type WeekProgressMeta,
  type WeekProgressRowVisual,
  type WeekProgressTask,
} from "./week-progress-data";

const BREAKDOWN_KEYS: readonly WeekProgressBreakdownKey[] = [
  "assignees",
  "labels",
  "priority",
  "estimate",
  "teams",
];

export function WeekProgressPanel({
  tasks,
  meta,
  onClose,
  className,
}: {
  readonly tasks: readonly WeekProgressTask[];
  readonly meta: WeekProgressMeta;
  readonly onClose?: () => void;
  readonly className?: string;
}) {
  const data = useMemo(() => buildWeekProgressData({ tasks, meta }), [tasks, meta]);

  const { scope, started, completed } = data.summary;

  return (
    <aside
      aria-label="Week Progress"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border bg-background p-4 shadow-xs",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-sm font-semibold">Week Progress</h2>
          <p className="text-xs text-muted-foreground">
            Task-count progress for this Team and Week
          </p>
        </div>
        {onClose ? (
          <Button
            aria-label="Close Week Progress"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        ) : null}
      </header>

      {scope === 0 ? (
        <EmptyWeek />
      ) : (
        <>
          <ProgressSummary
            completed={completed}
            completedPercentage={data.completedPercentage}
            scope={scope}
            started={started}
            startedPercentage={data.startedPercentage}
          />

          <Tabs defaultValue="assignees">
            <TabsList className="grid w-full grid-cols-5" variant="line">
              {BREAKDOWN_KEYS.map((key) => (
                <TabsTrigger className="text-xs" key={key} value={key}>
                  {data.breakdowns[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
            {BREAKDOWN_KEYS.map((key) => (
              <TabsContent className="mt-3 grid gap-2.5" key={key} value={key}>
                {data.breakdowns[key].rows.length ? (
                  data.breakdowns[key].rows.map((row) => (
                    <BreakdownRow
                      count={row.count}
                      key={row.id}
                      label={row.label}
                      percentage={row.percentage}
                      visual={row.visual}
                    />
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">No scoped Tasks.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </aside>
  );
}

function ProgressSummary({
  scope,
  started,
  completed,
  startedPercentage,
  completedPercentage,
}: {
  readonly scope: number;
  readonly started: number;
  readonly completed: number;
  readonly startedPercentage: number;
  readonly completedPercentage: number;
}) {
  // Completed nests inside Started (every Done Task is also Started), so the bar
  // layers the lighter Started fill behind the solid Completed fill.
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Scope" value={scope} />
        <Metric
          accent="text-primary"
          hint={`${Math.round(startedPercentage)}%`}
          label="Started"
          value={started}
        />
        <Metric
          accent="text-emerald-600 dark:text-emerald-400"
          hint={`${Math.round(completedPercentage)}%`}
          label="Completed"
          value={completed}
        />
      </div>

      <div
        aria-label={`${Math.round(startedPercentage)}% started, ${Math.round(
          completedPercentage,
        )}% completed`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        role="img"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/30 transition-all"
          style={{ width: `${startedPercentage}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${completedPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <LegendDot className="bg-primary/30" label="Started" />
        <LegendDot className="bg-emerald-500" label="Completed" />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly hint?: string;
  readonly accent?: string;
}) {
  return (
    <div className="grid gap-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-xl font-semibold tabular-nums", accent)}>{value}</span>
        {hint ? <span className="text-xs text-muted-foreground tabular-nums">{hint}</span> : null}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function LegendDot({ className, label }: { readonly className: string; readonly label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function BreakdownRow({
  label,
  count,
  percentage,
  visual,
}: {
  readonly label: string;
  readonly count: number;
  readonly percentage: number;
  readonly visual: WeekProgressRowVisual;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <RowMarker visual={visual} />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5 text-xs text-muted-foreground tabular-nums">
          <span>{Math.round(percentage)}%</span>
          <span aria-hidden>·</span>
          <span className="font-medium text-foreground">{count}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70 transition-all"
          style={{ width: `${Math.max(percentage, percentage > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function RowMarker({ visual }: { readonly visual: WeekProgressRowVisual }) {
  switch (visual.kind) {
    case "assignee":
      return visual.userId ? (
        <UserAvatar className="size-5 shrink-0" name={null} size={20} userId={visual.userId} />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
          <Users className="size-3" />
        </span>
      );
    case "label":
      return (
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            visual.color
              ? labelDotClassName({ name: visual.name, color: visual.color })
              : "border border-dashed",
          )}
        />
      );
    case "priority": {
      const meta = getPriorityMeta(visual.priority);
      const Icon = meta.icon;
      return (
        <span className="flex size-5 shrink-0 items-center justify-center">
          <Icon className={cn("size-4", meta.className ?? "text-muted-foreground")} />
        </span>
      );
    }
    case "estimate": {
      const meta = getEstimateMeta(visual.estimate);
      return (
        <span className="flex size-5 shrink-0 items-center justify-center rounded border text-[10px] font-semibold text-muted-foreground tabular-nums">
          {meta.short ?? "–"}
        </span>
      );
    }
    case "team":
      return <TeamAvatar className="shrink-0" name={visual.name} size={20} />;
  }
}

function EmptyWeek() {
  return (
    <div className="grid place-items-center gap-1 rounded-lg border border-dashed bg-muted/10 px-4 py-10 text-center">
      <p className="text-sm font-medium">No Tasks this Week</p>
      <p className="text-xs text-muted-foreground">
        Week Progress appears once this Team has Tasks in the Week.
      </p>
    </div>
  );
}
