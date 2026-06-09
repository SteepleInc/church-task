import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AssigneeAvatar,
  CardComboboxSelector,
  getPriorityMeta,
  getSizeMeta,
  PRIORITY_OPTIONS,
  SIZE_OPTIONS,
  WorkflowStatusIcon,
  type TaskPriority,
  type TaskSize,
} from "./task-card-fields";
import type { TaskBoardTaskState } from "./task-kanban-adapter";

describe("Task card priority field (stub)", () => {
  test("offers the Linear priority levels in display order", () => {
    expect(PRIORITY_OPTIONS.map((option) => option.value)).toEqual([
      "no_priority",
      "urgent",
      "high",
      "medium",
      "low",
    ]);
    expect(PRIORITY_OPTIONS.map((option) => option.label)).toEqual([
      "No priority",
      "Urgent",
      "High",
      "Medium",
      "Low",
    ]);
  });

  test("resolves metadata for each priority and falls back to No priority", () => {
    expect(getPriorityMeta("urgent").label).toBe("Urgent");
    expect(getPriorityMeta("medium").label).toBe("Medium");
    expect(getPriorityMeta("nonsense" as TaskPriority).value).toBe("no_priority");
  });

  test("highlights Urgent with the warning accent color", () => {
    expect(getPriorityMeta("urgent").className).toBe("text-orange-500");
    expect(getPriorityMeta("high").className).toBeUndefined();
  });
});

describe("Task card size field (stub)", () => {
  test("offers the Linear estimate sizes in display order", () => {
    expect(SIZE_OPTIONS.map((option) => option.value)).toEqual([
      "no_estimate",
      "xs",
      "s",
      "m",
      "l",
      "xl",
    ]);
  });

  test("resolves a short badge label for sized estimates and none for no estimate", () => {
    expect(getSizeMeta("m").short).toBe("M");
    expect(getSizeMeta("xl").short).toBe("XL");
    expect(getSizeMeta("no_estimate").short).toBeNull();
    expect(getSizeMeta("nonsense" as TaskSize).value).toBe("no_estimate");
  });
});

describe("Workflow status icon", () => {
  test("uses a distinct accent color per task state", () => {
    const colorFor = (taskState: TaskBoardTaskState) =>
      renderToStaticMarkup(<WorkflowStatusIcon taskState={taskState} />);

    expect(colorFor("todo")).toContain("text-muted-foreground");
    expect(colorFor("in_progress")).toContain("text-amber-500");
    expect(colorFor("done")).toContain("text-emerald-500");
    expect(colorFor("canceled")).toContain("text-muted-foreground");
  });
});

describe("Assignee avatar", () => {
  test("renders an unassigned placeholder when no assignee is selected", () => {
    const html = renderToStaticMarkup(<AssigneeAvatar assignee={null} />);

    expect(html).toContain("text-muted-foreground");
    expect(html).not.toContain('data-slot="avatar"');
  });

  test("renders a user avatar when an assignee is selected", () => {
    const html = renderToStaticMarkup(
      <AssigneeAvatar assignee={{ id: "user-1", label: "Ada Lovelace" }} />,
    );

    expect(html).toContain('data-slot="avatar"');
  });
});

describe("Card inline combobox selector", () => {
  test("renders an accessible combobox trigger that shows the current value", () => {
    const html = renderToStaticMarkup(
      <CardComboboxSelector
        ariaLabel="Change priority"
        options={[
          { value: "low", label: "Low" },
          { value: "high", label: "High" },
        ]}
        onValueChange={() => {}}
        trigger={<span>Priority</span>}
        value="low"
      />,
    );

    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-label="Change priority"');
    expect(html).toContain('data-slot="card-combobox-trigger"');
    expect(html).toContain("Priority");
  });

  test("can be disabled so the trigger is not interactive", () => {
    const renderSelector = (disabled: boolean) =>
      renderToStaticMarkup(
        <CardComboboxSelector
          ariaLabel="Change status"
          disabled={disabled}
          options={[]}
          onValueChange={() => {}}
          trigger={<span>Status</span>}
          value={null}
        />,
      );

    expect(renderSelector(true)).toContain("data-disabled");
    expect(renderSelector(false)).not.toContain("data-disabled");
  });
});
