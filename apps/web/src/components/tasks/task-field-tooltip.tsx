import type { ReactElement } from "react";

import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Wraps a Task field's visual trigger with a Linear-style "action + shortcut"
 * tooltip (e.g. "Change priority `P`"). The tooltip lives inside the picker's
 * own combobox/popover trigger, so it only describes the hover affordance and
 * never intercepts the click or keyboard wiring. Shared by every surface that
 * renders the field inputs (board cards, list rows, ...). Pass `disabled` on
 * the drag overlay / non-interactive contexts where hover tooltips are noise.
 */
export function FieldTooltip({
  label,
  shortcut,
  disabled,
  children,
}: {
  readonly label: string;
  readonly shortcut?: string | null;
  readonly disabled?: boolean;
  readonly children: ReactElement;
}) {
  if (disabled) return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>
        <TooltipShortcut label={label} shortcut={shortcut} />
      </TooltipContent>
    </Tooltip>
  );
}
