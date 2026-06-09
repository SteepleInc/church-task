import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleUserRound,
  LoaderCircle,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { UserAvatar } from "@/components/avatars/userAvatar";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPrimitive,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

import type { TaskBoardTaskState } from "./task-kanban-adapter";

// --- Priority (stubbed: local-only, no backend yet) -------------------------

export type TaskPriority = "no_priority" | "urgent" | "high" | "medium" | "low";

type PriorityMeta = {
  readonly value: TaskPriority;
  readonly label: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly className?: string;
};

function PriorityNoneIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <line x1="5" x2="7" y1="12" y2="12" />
      <line x1="11" x2="13" y1="12" y2="12" />
      <line x1="17" x2="19" y1="12" y2="12" />
    </svg>
  );
}

export const PRIORITY_OPTIONS: readonly PriorityMeta[] = [
  { value: "no_priority", label: "No priority", icon: PriorityNoneIcon },
  { value: "urgent", label: "Urgent", icon: CircleAlert, className: "text-orange-500" },
  { value: "high", label: "High", icon: SignalHigh },
  { value: "medium", label: "Medium", icon: SignalMedium },
  { value: "low", label: "Low", icon: SignalLow },
];

export function getPriorityMeta(value: TaskPriority): PriorityMeta {
  return PRIORITY_OPTIONS.find((option) => option.value === value) ?? PRIORITY_OPTIONS[0];
}

// --- Size / estimate (stubbed: local-only, no backend yet) ------------------

export type TaskSize = "no_estimate" | "xs" | "s" | "m" | "l" | "xl";

type SizeMeta = {
  readonly value: TaskSize;
  readonly label: string;
  readonly short: string | null;
};

export const SIZE_OPTIONS: readonly SizeMeta[] = [
  { value: "no_estimate", label: "No estimate", short: null },
  { value: "xs", label: "XS", short: "XS" },
  { value: "s", label: "S", short: "S" },
  { value: "m", label: "M", short: "M" },
  { value: "l", label: "L", short: "L" },
  { value: "xl", label: "XL", short: "XL" },
];

export function getSizeMeta(value: TaskSize): SizeMeta {
  return SIZE_OPTIONS.find((option) => option.value === value) ?? SIZE_OPTIONS[0];
}

// --- Workflow status icon mapping -------------------------------------------

const STATE_ICON: Record<TaskBoardTaskState, LucideIcon> = {
  todo: CircleDashed,
  in_progress: LoaderCircle,
  done: CircleCheck,
  canceled: Ban,
};

const STATE_ICON_CLASS: Record<TaskBoardTaskState, string> = {
  todo: "text-muted-foreground",
  in_progress: "text-amber-500",
  done: "text-emerald-500",
  canceled: "text-muted-foreground",
};

export function WorkflowStatusIcon({
  taskState,
  className,
}: {
  readonly taskState: TaskBoardTaskState;
  readonly className?: string;
}) {
  const Icon = STATE_ICON[taskState] ?? CircleDot;
  return <Icon className={cn("size-4", STATE_ICON_CLASS[taskState], className)} />;
}

// --- Inline combobox selector trigger ---------------------------------------

export type CardSelectOption<Value extends string> = {
  readonly value: Value;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly keywords?: readonly string[];
};

type CardComboboxSelectorProps<Value extends string> = {
  readonly value: Value | null;
  readonly options: readonly CardSelectOption<Value>[];
  readonly onValueChange: (value: Value | null) => void;
  readonly trigger: ReactNode;
  readonly ariaLabel: string;
  readonly emptyText?: string;
  readonly disabled?: boolean;
};

/**
 * Inline, badge-sized combobox used on the Task card. Clicking the trigger opens
 * a searchable popup anchored to the trigger. Selector clicks are isolated so
 * they do not open the Task details pane.
 */
export function CardComboboxSelector<Value extends string>({
  value,
  options,
  onValueChange,
  trigger,
  ariaLabel,
  emptyText = "No results.",
  disabled = false,
}: CardComboboxSelectorProps<Value>) {
  const items = options.map((option) => option.value);
  const labelFor = (candidate: Value) =>
    options.find((option) => option.value === candidate)?.label ?? candidate;

  return (
    <Combobox<Value>
      disabled={disabled}
      items={items}
      itemToStringLabel={labelFor}
      onValueChange={(next) => onValueChange(next ?? null)}
      value={value}
    >
      <ComboboxPrimitive.Trigger
        aria-label={ariaLabel}
        className="inline-flex cursor-pointer items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
        data-slot="card-combobox-trigger"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {trigger}
      </ComboboxPrimitive.Trigger>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          align="start"
          className="z-50 select-none"
          data-slot="combobox-positioner"
          side="bottom"
          sideOffset={4}
        >
          <span className="relative flex max-h-full min-w-52 max-w-(--available-width) origin-(--transform-origin) rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5 transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]">
            <ComboboxPrimitive.Popup
              className="flex max-h-[min(var(--available-height),23rem)] flex-1 flex-col text-foreground"
              data-slot="combobox-popup"
              onClick={(event) => event.stopPropagation()}
            >
              <ComboboxPrimitive.Input
                className="mx-1 mt-1 h-8 rounded-md border-0 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                placeholder={ariaLabel}
              />
              <ComboboxEmpty>{emptyText}</ComboboxEmpty>
              <ComboboxList>
                {options.map((option) => (
                  <ComboboxItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.icon ? (
                        <span className="flex size-4 shrink-0 items-center justify-center">
                          {option.icon}
                        </span>
                      ) : null}
                      <span className="truncate">{option.label}</span>
                    </span>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxPrimitive.Popup>
          </span>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </Combobox>
  );
}

// --- Assignee option helper -------------------------------------------------

export type AssigneeOption = {
  readonly id: string;
  readonly label: string;
};

export function AssigneeAvatar({
  assignee,
  size = 20,
}: {
  readonly assignee: AssigneeOption | null;
  readonly size?: number;
}) {
  if (!assignee) {
    return (
      <span
        className="flex items-center justify-center rounded-full text-muted-foreground"
        style={{ height: size, width: size }}
      >
        <CircleUserRound className="size-full" strokeWidth={1.5} />
      </span>
    );
  }

  return <UserAvatar name={assignee.label} size={size} userId={assignee.id} />;
}
