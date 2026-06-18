import { describe, expect, test } from "bun:test";

import { buildWeekProgressData, type WeekProgressTask } from "./week-progress-data";

const meta = {
  assignees: [
    { id: "u1", label: "Alice" },
    { id: "u2", label: "Bob" },
  ],
  labels: [
    { id: "l1", name: "Follow up" },
    { id: "l2", name: "Sunday" },
  ],
  teams: [
    { id: "t1", name: "Worship" },
    { id: "t2", name: "Kids" },
  ],
} as const;

function task(partial: Partial<WeekProgressTask> & { readonly id: string }): WeekProgressTask {
  return {
    teamId: "t1",
    assignedUserId: null,
    taskState: "todo",
    estimate: null,
    labelIds: [],
    ...partial,
  };
}

describe("Week Progress data", () => {
  const tasks: readonly WeekProgressTask[] = [
    task({ id: "todo", assignedUserId: "u1", labelIds: ["l1"], priority: "high" }),
    task({ id: "started", taskState: "in_progress", teamId: "t2", estimate: "m" }),
    task({
      id: "done",
      taskState: "done",
      assignedUserId: "u2",
      labelIds: ["l1", "l2"],
      estimate: "xl",
    }),
    task({ id: "canceled", taskState: "canceled", assignedUserId: "u2", labelIds: ["l2"] }),
  ];

  test("computes task-count scope, started, and completed without canceled tasks", () => {
    const data = buildWeekProgressData({ tasks, meta });

    expect(data.summary).toEqual({ scope: 3, started: 2, completed: 1 });
    expect(data.startedPercentage).toBeCloseTo(66.666);
    expect(data.completedPercentage).toBeCloseTo(33.333);
  });

  test("builds assignee, label, priority, estimate, and team breakdowns", () => {
    const data = buildWeekProgressData({ tasks, meta });

    expect(data.breakdowns.assignees.rows.map(({ label, count }) => [label, count])).toEqual([
      ["Alice", 1],
      ["Bob", 1],
      ["Unassigned", 1],
    ]);
    expect(data.breakdowns.assignees.rows[0]?.percentage).toBeCloseTo(100 / 3);
    expect(data.breakdowns.labels.rows.map(({ label, count }) => [label, count])).toEqual([
      ["Follow up", 2],
      ["No label", 1],
      ["Sunday", 1],
    ]);
    expect(data.breakdowns.priority.rows.map(({ id, count }) => [id, count])).toEqual([
      ["high", 1],
      ["no_priority", 2],
    ]);
    expect(data.breakdowns.estimate.rows.map(({ id, count }) => [id, count])).toEqual([
      ["m", 1],
      ["xl", 1],
      ["no_estimate", 1],
    ]);
    expect(data.breakdowns.teams.rows.map(({ label, count }) => [label, count])).toEqual([
      ["Worship", 2],
      ["Kids", 1],
    ]);
  });
});
