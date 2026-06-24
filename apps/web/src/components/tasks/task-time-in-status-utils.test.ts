import { describe, expect, test } from "bun:test";

import {
  computeTimeInStatus,
  formatStatusDuration,
  parseStatusChanges,
} from "./task-time-in-status-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("parseStatusChanges", () => {
  test("keeps only status-change Activities and sorts them oldest-first", () => {
    const changes = parseStatusChanges([
      {
        event_type: "task.status_changed",
        occurred_at: 300,
        metadata: JSON.stringify({ from: { id: "b" }, to: { id: "c" } }),
      },
      { event_type: "task.assignee_changed", occurred_at: 250, metadata: "{}" },
      {
        event_type: "task.status_changed",
        occurred_at: 100,
        metadata: JSON.stringify({ from: { id: "a" }, to: { id: "b" } }),
      },
    ]);

    expect(changes).toEqual([
      { occurredAt: 100, fromStatusId: "a", toStatusId: "b" },
      { occurredAt: 300, fromStatusId: "b", toStatusId: "c" },
    ]);
  });

  test("tolerates missing/invalid metadata and already-parsed objects", () => {
    const changes = parseStatusChanges([
      { event_type: "task.status_changed", occurred_at: 1, metadata: null },
      { event_type: "task.status_changed", occurred_at: 2, metadata: "not json" },
      // Some callers may pass metadata as an object rather than a string.
      {
        event_type: "task.status_changed",
        occurred_at: 3,
        metadata: { from: { id: "x" }, to: { id: "y" } } as unknown as string,
      },
    ]);

    expect(changes).toEqual([
      { occurredAt: 1, fromStatusId: null, toStatusId: null },
      { occurredAt: 2, fromStatusId: null, toStatusId: null },
      { occurredAt: 3, fromStatusId: "x", toStatusId: "y" },
    ]);
  });
});

describe("computeTimeInStatus", () => {
  test("with no history, the Task has spent all its life in the current status", () => {
    const created = 0;
    const now = 5 * DAY;
    const result = computeTimeInStatus({
      createdAt: created,
      currentStatusId: "todo",
      changes: [],
      now,
    });

    expect(result).toEqual([{ statusId: "todo", durationMs: 5 * DAY }]);
  });

  test("replays transitions and totals time per status, descending", () => {
    const created = 0;
    const result = computeTimeInStatus({
      createdAt: created,
      currentStatusId: "done",
      changes: [
        // 2 days in todo, then move to in_progress.
        { occurredAt: 2 * DAY, fromStatusId: "todo", toStatusId: "in_progress" },
        // 3 days in in_progress, then move to done.
        { occurredAt: 5 * DAY, fromStatusId: "in_progress", toStatusId: "done" },
      ],
      now: 6 * DAY,
    });

    expect(result).toEqual([
      { statusId: "in_progress", durationMs: 3 * DAY },
      { statusId: "todo", durationMs: 2 * DAY },
      { statusId: "done", durationMs: 1 * DAY },
    ]);
  });

  test("clamps out-of-order timestamps to zero rather than going negative", () => {
    const result = computeTimeInStatus({
      createdAt: 10 * DAY,
      currentStatusId: "todo",
      // A transition recorded before creation (clock skew).
      changes: [{ occurredAt: 1 * DAY, fromStatusId: "todo", toStatusId: "todo" }],
      now: 12 * DAY,
    });

    // The pre-creation segment clamps to 0; only the live segment counts.
    expect(result).toEqual([{ statusId: "todo", durationMs: 2 * DAY }]);
  });
});

describe("formatStatusDuration", () => {
  test("renders compact units across the scale", () => {
    expect(formatStatusDuration(11 * SECOND)).toBe("11s");
    expect(formatStatusDuration(5 * MINUTE)).toBe("5m");
    expect(formatStatusDuration(3 * HOUR)).toBe("3h");
    expect(formatStatusDuration(2 * DAY)).toBe("2d");
    expect(formatStatusDuration(6 * 7 * DAY)).toBe("6w");
    expect(formatStatusDuration(120 * DAY)).toBe("4mo");
    expect(formatStatusDuration(2 * 365 * DAY)).toBe("2y");
  });
});
