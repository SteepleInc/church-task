import { describe, expect, test } from "bun:test";

import {
  buildProjectedTemplateTasksForCycle,
  buildTemplateSourceBadge,
  getTemplateScheduleColorClassName,
} from "./tasksData.app";

describe("scheduled Template projections for Cycle surfaces", () => {
  test("projects weekly Template Tasks into earlier Cycle To Do work with stable source badges", () => {
    const projections = buildProjectedTemplateTasksForCycle({
      cycle: { endDate: "2026-06-14", id: "cycle_2026_06_08", startDate: "2026-06-08" },
      existingTasks: [],
      schedules: [
        {
          church_id: "church_1",
          end_date: null,
          id: "templateschedule_sunday_service",
          kind: "weekly",
          name: "Sunday Service",
          recurrence: "repeating",
          rule: JSON.stringify({ kind: "weekly", weekdays: [0] }),
          start_date: "2026-06-21",
          template_id: "template_service",
        },
      ] as never,
      teamFilterId: "team_worship",
      templateTasks: [
        {
          assigned_user_id: "user_worship",
          description: "Pick songs before the service.",
          estimate: "m",
          id: "templatetask_plan_setlist",
          label_ids: JSON.stringify(["label_music"]),
          placement_cycle_offset: -1,
          placement_weekday: 3,
          template_id: "template_service",
          template_team_id: "templateteam_worship",
          title: "Plan setlist",
        },
      ] as never,
      templateTeams: [{ id: "templateteam_worship", mapped_team_id: "team_worship" }] as never,
      workflows: [{ id: "workflow_worship", team_id: "team_worship" }] as never,
      workflowStatuses: [
        {
          archived_at: null,
          id: "workflowstatus_todo",
          task_state: "todo",
          workflow_id: "workflow_worship",
        },
      ] as never,
    });

    expect(projections).toHaveLength(1);
    expect(projections[0]).toMatchObject({
      dueDate: "2026-06-10",
      id: "projected-template-task:templateschedule_sunday_service:templatetask_plan_setlist:weekly:2026-06-21:sunday:cycle_2026_06_08",
      identifier: "Projected",
      sourceTemplateOccurrenceKey: "weekly:2026-06-21:sunday",
      sourceTemplateScheduleId: "templateschedule_sunday_service",
      taskState: "todo",
      teamId: "team_worship",
      title: "Plan setlist",
      workflowStatusId: "workflowstatus_todo",
    });
    expect(projections[0]?.sourceBadge).toMatchObject({
      colorClassName: getTemplateScheduleColorClassName("templateschedule_sunday_service"),
      occurrenceDate: "2026-06-21",
      occurrenceLabel: "Sunday Jun 21",
      occurrencePeriod: "2026-06",
      scheduleName: "Sunday Service",
    });
  });

  test("keeps the same source badge for materialized scheduled Tasks", () => {
    const badge = buildTemplateSourceBadge({
      occurrenceKey: "weekly:2026-06-21:sunday",
      schedule: { id: "templateschedule_sunday_service", name: "Sunday Service" },
    });

    expect(badge).toMatchObject({
      colorClassName: getTemplateScheduleColorClassName("templateschedule_sunday_service"),
      occurrenceDate: "2026-06-21",
      scheduleName: "Sunday Service",
    });
  });
});
