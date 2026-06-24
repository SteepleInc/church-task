import { CircleCheck, CircleDashed, CirclePlay } from "lucide-react";
import { type ReactElement } from "react";

import {
  useWeekProgress,
  type WeekPickerOption,
  type WeekPickerStatus,
} from "@/data/cycles/cyclesData.app";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { weekTooltipSummary, weekdaysLeftLabel } from "./task-week-tooltip-utils";

// Leading status glyph, echoing the Week picker rows and Linear's cycle hover:
// the live Week reads as a filled play marker tinted with the brand color, a
// planned Week as a hollow play marker, and a finished Week as a muted check.
const WEEK_STATUS_ICON = {
  current: CirclePlay,
  upcoming: CirclePlay,
  completed: CircleCheck,
} as const;

const WEEK_STATUS_ICON_CLASS: Record<WeekPickerStatus, string> = {
  current: "text-primary",
  upcoming: "text-muted-foreground",
  completed: "text-muted-foreground",
};

type WeekTooltipProps = {
  readonly option: WeekPickerOption;
  readonly churchId: string | null;
  // The visual Week chip to attach the hover to (the same node passed to the
  // Week picker trigger).
  readonly children: ReactElement;
  // When true (drag overlay / non-interactive / projected) the rich tooltip is
  // suppressed and the trigger renders bare.
  readonly disabled?: boolean;
};

/**
 * Linear-style Week hover for a Task's Week chip: a card whose header is the
 * Week's status glyph + name, with a body row pairing a completion ring against
 * a one-line summary ("25% of 48 · Current · 18 weekdays left") and the
 * change-Week shortcut in the footer. The completion query it reads from is
 * lazy — the inner panel only mounts (and so only subscribes) while the tooltip
 * is open, so resting the board never fans out a query per card.
 */
export function WeekTooltip({ option, churchId, children, disabled }: WeekTooltipProps) {
  if (disabled) return children;
  const Icon = WEEK_STATUS_ICON[option.status];
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        align="start"
        // A richer multi-row card rather than the single-line action chip; the
        // light surface + ring come from TooltipContent.
        className="block w-64 items-stretch gap-0 p-0 text-sm font-normal"
        side="bottom"
        sideOffset={6}
      >
        <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-1.5">
          <Icon className={cn("size-4 shrink-0", WEEK_STATUS_ICON_CLASS[option.status])} />
          <span className="min-w-0 truncate font-medium">{option.label}</span>
        </div>
        <WeekTooltipSummary churchId={churchId} option={option} />
        <div className="flex items-center justify-between border-t px-2.5 py-1.5 text-muted-foreground text-xs">
          <span>Change week</span>
          <Kbd>⇧ C</Kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function WeekTooltipSummary({
  option,
  churchId,
}: {
  readonly option: WeekPickerOption;
  readonly churchId: string | null;
}) {
  const { scope, completedPercentage } = useWeekProgress({ churchId, cycleId: option.id });
  const today = new Date().toISOString().slice(0, 10);
  const summary = weekTooltipSummary({
    scope,
    completedPercentage,
    relativeLabel: option.relativeLabel,
    weekdaysLeft: weekdaysLeftLabel(today, option.endDate),
  });
  return (
    <div className="flex items-center gap-2 px-2.5 pb-2.5 text-muted-foreground text-xs">
      <CompletionRing percentage={completedPercentage} />
      <span className="min-w-0 truncate">{summary || option.dateRange}</span>
    </div>
  );
}

/**
 * A small completion donut sized to sit beside the summary line, mirroring the
 * Weeks index `CapacityRing`: an empty Week reads as a dashed circle, otherwise
 * the brand-tinted arc fills to the completion percentage.
 */
function CompletionRing({ percentage }: { readonly percentage: number }) {
  if (percentage <= 0) {
    return <CircleDashed aria-hidden className="size-4 shrink-0 text-muted-foreground/50" />;
  }
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(percentage, 100) / 100) * circumference;
  return (
    <svg aria-hidden className="size-4 shrink-0 -rotate-90" viewBox="0 0 16 16">
      <circle cx="8" cy="8" fill="none" r={radius} stroke="var(--color-muted)" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        fill="none"
        r={radius}
        stroke="var(--color-primary)"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
