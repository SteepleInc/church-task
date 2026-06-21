import { describe, expect, test } from "bun:test";

const taskDetailsPaneSource = await Bun.file(
  "apps/web/src/features/details-pane/task-details-pane.tsx",
).text();
const subTaskRowSource = await Bun.file(
  "apps/web/src/features/details-pane/sub-task-row.tsx",
).text();
const subTaskSectionSource = await Bun.file(
  "apps/web/src/features/details-pane/sub-task-section.tsx",
).text();

describe("Task details pane shared Task menu wiring", () => {
  test("wraps the parent Task property band in the shared TaskContextMenu", () => {
    expect(taskDetailsPaneSource).toContain("<TaskContextMenu");
    expect(taskDetailsPaneSource).toContain("task={toMenuTask(task)}");
    expect(taskDetailsPaneSource).toContain("onChangeTaskStatus");
    expect(taskDetailsPaneSource).toContain("onChangeTaskTeam");
  });

  test("wraps sub-task rows in the shared TaskContextMenu with row-scoped edits", () => {
    expect(subTaskRowSource).toContain("<TaskContextMenu");
    expect(subTaskRowSource).toContain("task={menuTask}");
    expect(subTaskRowSource).toContain("context.onEdit(change.taskId");
    expect(subTaskSectionSource).toContain("teamMemberIdsByTeamId");
  });
});
