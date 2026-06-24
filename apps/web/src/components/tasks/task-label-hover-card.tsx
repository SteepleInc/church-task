import { Tag } from "lucide-react";
import type { ReactElement } from "react";

import { useTaskLabelCard } from "@/data/labels/labelsData.app";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { labelDotClassName } from "./task-card-fields";

type LabelHoverCardProps = {
  // The Label this chip represents; its name, color, Task count, and owning
  // Team are resolved from this id.
  readonly labelId: string;
  // The label chip to attach the hover to.
  readonly children: ReactElement;
  // Suppressed on the drag overlay, where hover surfaces would be noise.
  readonly disabled?: boolean;
};

/**
 * Linear-style rich tooltip for a Label chip: the colored Label dot + name, a
 * separator, then the count of Tasks carrying the Label and its scope (the
 * owning Team for a Team Label, otherwise the Church). Self-contained — it
 * resolves the Label's data from `labelId` via a Church-scoped Zero hook
 * (collapsing to one query across every Label hover). Hover-only: clicks pass
 * through to the underlying labels picker so the chip still opens it. Built on
 * the shared Tooltip primitive so it shares one timer/animation with every
 * other field tooltip.
 */
export function LabelHoverCard({ labelId, children, disabled }: LabelHoverCardProps) {
  const label = useTaskLabelCard(labelId);
  if (disabled || label === null) return children;

  const teamName = label.teamName;
  const count = label.taskCount;
  const countLabel = `${count} labeled ${count === 1 ? "task" : "tasks"}`;
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
