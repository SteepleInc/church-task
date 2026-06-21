import { CalendarDays, Tag, Triangle, User, Users, Workflow } from "lucide-react";
import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { resolveTaskFieldShortcut, type TaskShortcutField } from "./task-surface-keyboard-utils";

export type DraftTaskPickerRefs = Partial<
  Record<TaskShortcutField, MutableRefObject<(() => void) | null>>
>;

const FIELD_ITEMS: readonly {
  readonly field: TaskShortcutField;
  readonly label: string;
  readonly shortcut: string;
  readonly icon: ReactNode;
}[] = [
  { field: "status", label: "Status", shortcut: "S", icon: <Workflow /> },
  { field: "assignee", label: "Assignee", shortcut: "A", icon: <User /> },
  { field: "priority", label: "Priority", shortcut: "P", icon: <Triangle /> },
  { field: "estimate", label: "Estimate", shortcut: "⇧E", icon: <Triangle /> },
  { field: "labels", label: "Labels", shortcut: "L", icon: <Tag /> },
  { field: "dueDate", label: "Due date", shortcut: "D", icon: <CalendarDays /> },
  { field: "team", label: "Team", shortcut: "T", icon: <Users /> },
];

function openPicker(ref: MutableRefObject<(() => void) | null> | undefined) {
  requestAnimationFrame(() => ref?.current?.());
}

export function DraftTaskPropertySurface({
  children,
  pickerRefs,
  className = "relative",
}: {
  readonly children: ReactNode;
  readonly pickerRefs: DraftTaskPickerRefs;
  readonly className?: string;
}) {
  const armedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!armedRef.current) return;
      const intent = resolveTaskFieldShortcut(event);
      if (intent.kind !== "field") return;
      const opener = pickerRefs[intent.field]?.current;
      if (!opener) return;
      event.preventDefault();
      opener();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pickerRefs]);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        onContextMenu={(event) => event.stopPropagation()}
        onPointerEnter={() => {
          armedRef.current = true;
        }}
        render={<div className={className} data-task-draft-property-surface="true" />}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          {FIELD_ITEMS.map((item) =>
            pickerRefs[item.field] ? (
              <ContextMenuItem key={item.field} onClick={() => openPicker(pickerRefs[item.field])}>
                {item.icon}
                {item.label}
                <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
              </ContextMenuItem>
            ) : null,
          )}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
