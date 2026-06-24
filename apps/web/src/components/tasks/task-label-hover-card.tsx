import { Tag } from "lucide-react";
import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { labelDotClassName, type TaskLabelOption } from "./task-card-fields";

type LabelHoverCardProps = {
  readonly label: TaskLabelOption & {
    readonly taskCount?: number;
    readonly teamId?: string | null;
  };
  // Resolved Team name for the Label's owning Team (a Team Label), or null for
  // a Church-wide Label.
  readonly teamName: string | null;
  // The label chip to attach the hover to.
  readonly children: ReactElement;
  // Suppressed on the drag overlay, where hover surfaces would be noise.
  readonly disabled?: boolean;
};

/**
 * Linear-style rich tooltip for a Label chip: the colored Label dot + name, a
 * separator, then the count of Tasks carrying the Label and its scope (the
 * owning Team for a Team Label, otherwise the Church). Hover-only — clicks pass
 * through to the underlying labels picker so the chip still opens it. Built on
 * the shared Tooltip primitive so it shares one timer/animation with every
 * other field tooltip.
 */
export function LabelHoverCard({ label, teamName, children, disabled }: LabelHoverCardProps) {
  if (disabled) return children;

  const count = label.taskCount;
  const countLabel =
    count === undefined ? null : `${count} labeled ${count === 1 ? "task" : "tasks"}`;
  const hasFooter = countLabel !== null || teamName !== null;

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        align="start"
        // Only the footer (count + team, justified apart) needs the fixed width;
        // a bare name would otherwise float in a too-wide box, so size to fit.
        className={cn(
          "block items-stretch gap-0 p-2.5 text-sm font-normal",
          hasFooter ? "w-60" : "w-fit max-w-60",
        )}
        side="bottom"
      >
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 shrink-0 rounded-full", labelDotClassName(label))} />
          <span className="min-w-0 truncate font-medium text-sm">{label.name}</span>
        </div>
        {countLabel || teamName ? (
          <div className="mt-2 flex items-center justify-between gap-3 border-t pt-2 text-muted-foreground text-xs">
            {countLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Tag className="size-3.5" />
                {countLabel}
              </span>
            ) : (
              <span />
            )}
            {teamName ? <span className="truncate">{teamName}</span> : null}
          </div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
