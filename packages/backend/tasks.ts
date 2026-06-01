import type { GenericDatabaseReader, GenericMutationCtx } from "convex/server";

import { buildCycleForLocalDate } from "./churchCycleCalendar";
import type { DataModel, Id } from "./convex/_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

type TaskCreateInput = {
  readonly title: string;
  readonly teamId: string | null;
  readonly workflowStatusId: string;
  readonly dueDate: string;
  readonly parentTaskId: string | null;
};

type TaskState = "todo" | "in_progress" | "done" | "canceled";

export async function readTaskModel(
  ctx: { readonly db: GenericDatabaseReader<DataModel> },
  churchId: string,
) {
  const cycles = await ctx.db
    .query("cycles")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();

  return { cycles, tasks };
}

async function ensureCycleForDueDate(
  ctx: MutationCtx,
  args: { readonly churchId: string; readonly dueDate: string; readonly churchTimeZone: string },
) {
  const cycle = buildCycleForLocalDate({
    localDate: args.dueDate,
    churchTimeZone: args.churchTimeZone,
  });
  const existing = await ctx.db
    .query("cycles")
    .withIndex("by_churchId_and_startDate", (q) =>
      q.eq("churchId", args.churchId).eq("startDate", cycle.startDate),
    )
    .unique();

  if (existing) return existing._id;

  return await ctx.db.insert("cycles", {
    churchId: args.churchId,
    ...cycle,
  });
}

export async function createTasks(
  ctx: MutationCtx,
  args: {
    readonly churchId: string;
    readonly churchTimeZone: string;
    readonly tasks: ReadonlyArray<TaskCreateInput>;
  },
) {
  const createdTaskIds: Array<Id<"tasks">> = [];
  const validatedTasks: Array<{
    readonly task: TaskCreateInput;
    readonly workflowId: string;
    readonly workflowStatusId: Id<"workflowStatuses">;
    readonly taskState: TaskState;
  }> = [];

  for (const task of args.tasks) {
    const workflowStatus = await ctx.db.get(task.workflowStatusId as Id<"workflowStatuses">);
    if (
      !workflowStatus ||
      workflowStatus.churchId !== args.churchId ||
      workflowStatus.archivedAt !== null
    ) {
      return { ok: false as const, code: "workflowStatusNotFound" };
    }

    if (task.parentTaskId) {
      const parentTask = await ctx.db.get(task.parentTaskId as Id<"tasks">);
      if (!parentTask || parentTask.churchId !== args.churchId) {
        return { ok: false as const, code: "parentTaskNotFound" };
      }
    }

    try {
      buildCycleForLocalDate({ localDate: task.dueDate, churchTimeZone: args.churchTimeZone });
    } catch {
      return { ok: false as const, code: "invalidDueDate" };
    }

    validatedTasks.push({
      task,
      workflowId: workflowStatus.workflowId,
      workflowStatusId: workflowStatus._id,
      taskState: workflowStatus.taskState,
    });
  }

  for (const { task, workflowId, workflowStatusId, taskState } of validatedTasks) {
    const cycleId = await ensureCycleForDueDate(ctx, {
      churchId: args.churchId,
      dueDate: task.dueDate,
      churchTimeZone: args.churchTimeZone,
    });

    const taskId = await ctx.db.insert("tasks", {
      churchId: args.churchId,
      title: task.title,
      teamId: task.teamId,
      cycleId,
      dueDate: task.dueDate,
      parentTaskId: task.parentTaskId,
      workflowId,
      workflowStatusId,
      taskState,
    });
    createdTaskIds.push(taskId);
  }

  return { ok: true as const, createdTaskIds };
}
