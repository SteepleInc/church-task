import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * The Task a band of field inputs edits. Supplied once per Task surface (board
 * card, list row, details pane, sub-task row) so the self-contained field
 * tooltips can resolve Task-scoped data (time-in-status, Week completion) from
 * the Task's own id without every call site threading it through. Creation
 * flows (the create dialog, sub-task creator, template authoring) render the
 * same inputs with no provider, so their rich tooltips degrade to the plain
 * action tooltip.
 */
export type TaskFieldContextValue = {
  readonly taskId: string;
};

const TaskFieldContext = createContext<TaskFieldContextValue | null>(null);

/** Wrap a Task's field inputs so their tooltips can self-resolve Task data. */
export function TaskFieldProvider({
  taskId,
  children,
}: {
  readonly taskId: string;
  readonly children: ReactNode;
}) {
  const value = useMemo<TaskFieldContextValue>(() => ({ taskId }), [taskId]);
  return <TaskFieldContext.Provider value={value}>{children}</TaskFieldContext.Provider>;
}

/**
 * The Task a field input belongs to, or `null` outside a Task surface (creation
 * flows). Tooltips use this to decide between their rich, Task-scoped variant
 * and the plain action tooltip.
 */
export function useTaskFieldContext(): TaskFieldContextValue | null {
  return useContext(TaskFieldContext);
}
