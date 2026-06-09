import { describe, expect, test } from "bun:test";

import { statusOptions, toTaskIdentifier } from "./task-kanban-board";
import type { TaskBoardWorkflowStatus } from "./task-kanban-adapter";

describe("Task card identifier stub", () => {
  test("derives a short Linear-style identifier from the Task id", () => {
    expect(toTaskIdentifier("task_abcd1234")).toBe("TASK-1234");
    expect(toTaskIdentifier("k57-9f3b")).toBe("TASK-9F3B");
  });

  test("uppercases and pads from short ids without separators", () => {
    expect(toTaskIdentifier("ab")).toBe("TASK-AB");
  });
});

describe("Task card status selector options", () => {
  const statuses: readonly TaskBoardWorkflowStatus[] = [
    { id: "done", name: "Done", sortOrder: 3, taskState: "done" },
    { id: "todo", name: "To Do", sortOrder: 1, taskState: "todo" },
    { id: "doing", name: "Doing", sortOrder: 2, taskState: "in_progress" },
    { id: "old", name: "Archived", sortOrder: 4, taskState: "todo", archivedAt: "now" },
  ];

  test("lists active Workflow Statuses in sort order for the status picker", () => {
    expect(statusOptions(statuses).map((option) => option.value)).toEqual([
      "todo",
      "doing",
      "done",
    ]);
    expect(statusOptions(statuses).map((option) => option.label)).toEqual([
      "To Do",
      "Doing",
      "Done",
    ]);
  });

  test("excludes archived Workflow Statuses from the status picker", () => {
    expect(statusOptions(statuses).map((option) => option.value)).not.toContain("old");
  });

  test("renders a status icon for every option", () => {
    expect(statusOptions(statuses).every((option) => option.icon != null)).toBe(true);
  });
});
