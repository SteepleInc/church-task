import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

// While *any* field's picker/popover is open, every tooltip should stay closed.
// An open input already shows the field, and the tooltip timer is shared across
// the whole board, so a tooltip for a different pill (e.g. "Change week" while
// the labels picker is open) is noise — and would float over the popup. We track
// open pickers in a tiny module-level store so suppression is global, regardless
// of where each picker/tooltip sits in the React tree.
let openPickerCount = 0;
const openPickerListeners = new Set<() => void>();

const emitOpenPickerChange = () => {
  for (const listener of openPickerListeners) listener();
};

const subscribeOpenPickers = (listener: () => void): (() => void) => {
  openPickerListeners.add(listener);
  return () => {
    openPickerListeners.delete(listener);
  };
};

const getAnyPickerOpen = (): boolean => openPickerCount > 0;
// The store is global/non-isomorphic; tooltips never render on the server, so a
// constant server snapshot keeps useSyncExternalStore happy.
const getServerSnapshot = (): boolean => false;

const registerOpenPicker = (): (() => void) => {
  openPickerCount += 1;
  emitOpenPickerChange();
  return () => {
    openPickerCount -= 1;
    emitOpenPickerChange();
  };
};

/**
 * Suppresses every Tooltip (across all surfaces) while `suppressed` is true.
 * Field pickers pass their own open state; whenever at least one picker is open,
 * all field tooltips — the hovered one and any other — stay closed.
 */
function TooltipSuppressor({
  suppressed,
  children,
}: {
  readonly suppressed: boolean;
  readonly children: ReactNode;
}) {
  useEffect(() => {
    if (!suppressed) return;
    return registerOpenPicker();
  }, [suppressed]);
  return <>{children}</>;
}

// Linear opens its property tooltips after a brief hover so they don't flash
// while the pointer sweeps across a card's pills, but keeps them instant once
// one is already showing. Every Task surface (simple action tooltips and the
// rich assignee/label cards) renders through this primitive so they share one
// timer, one skip-delay group, and one open/close animation.
function TooltipProvider({
  delay = 304,
  closeDelay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      closeDelay={closeDelay}
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({ disabled, ...props }: TooltipPrimitive.Root.Props) {
  const anyPickerOpen = useSyncExternalStore(
    subscribeOpenPickers,
    getAnyPickerOpen,
    getServerSnapshot,
  );
  // While any field picker is open we disable every tooltip (which also closes
  // any open one). `disabled` leaves base-ui's open state uncontrolled, so we
  // never flip the tooltip between controlled and uncontrolled.
  return (
    <TooltipPrimitive.Root data-slot="tooltip" disabled={anyPickerOpen || disabled} {...props} />
  );
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-2 rounded-md bg-popover px-2 py-1 text-popover-foreground text-xs font-medium shadow-md ring-1 ring-foreground/10 has-data-[slot=kbd]:pr-1 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:h-4.5 **:data-[slot=kbd]:min-w-4.5 **:data-[slot=kbd]:rounded **:data-[slot=kbd]:px-1 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * The Linear-style "action + shortcut" tooltip body: a label (e.g. "Change
 * status") followed by the field's keyboard shortcut chip (e.g. `S`, `⇧ E`).
 * Pass `shortcut` as the same string the picker binds (space-separated chords
 * like "⇧ E" render as separate keys). Omit it for a plain label tooltip.
 */
function TooltipShortcut({
  label,
  shortcut,
}: {
  readonly label: string;
  readonly shortcut?: string | null;
}) {
  return (
    <>
      <span>{label}</span>
      {shortcut ? (
        <span className="inline-flex items-center gap-0.5">
          {shortcut.split(" ").map((key, index) => (
            <Kbd key={`${key}-${index}`}>{key}</Kbd>
          ))}
        </span>
      ) : null}
    </>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipShortcut,
  TooltipSuppressor,
};
