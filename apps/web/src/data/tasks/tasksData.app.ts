import { formatTaskIdentifier, type TaskEstimate, type TaskStatus } from "@church-task/domain";
import { mutators, queries, type ListArgs, type Task, type Team } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

export type TaskCollectionFilters = {
  readonly surface?: "my_work" | "our_work";
  readonly teamId?: string;
};

export type TaskCollectionItem = {
  readonly id: string;
  readonly churchId: string;
  readonly title: string;
  readonly description: string | null;
  readonly teamId: string;
  readonly number: number;
  readonly identifier: string;
  readonly previousIdentifiers: readonly string[];
  readonly assignedUserId: string | null;
  readonly cycleId: string;
  readonly dueDate: string | null;
  readonly createdAt: number;
  readonly createdByUserId: string | null;
  readonly parentTaskId: string | null;
  readonly labelIds: readonly string[];
  readonly workflowId: string;
  readonly workflowStatusId: string;
  readonly taskState: TaskStatus;
  readonly estimate: TaskEstimate | null;
  readonly boardOrder: string;
  readonly finishedAt: string | null;
  readonly sourceTemplateId: string | null;
  readonly sourceTemplateTaskId: string | null;
  readonly sourceTemplateCycleId: string | null;
  readonly sourceTemplateSyncEnabled: boolean;
};

export type TaskUpdateFields = {
  readonly title?: string;
  readonly assignedUserId?: string | null;
  readonly teamId?: string;
  readonly workflowStatusId?: string;
  readonly dueDate?: string | null;
  readonly cycleId?: string;
  readonly parentTaskId?: string | null;
  readonly boardOrder?: string;
  readonly labelIds?: readonly string[];
  readonly estimate?: TaskEstimate | null;
};

type MutationResult<Data = undefined> = Promise<
  | { readonly ok: true; readonly data: Data }
  | { readonly ok: false; readonly error: { readonly message: string } }
>;

const parseStringArray = (value: string | null | undefined): readonly string[] => {
  try {
    const parsed = JSON.parse(value ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const taskStatus = (value: string): TaskStatus => {
  if (value === "todo" || value === "in_progress" || value === "done" || value === "canceled") {
    return value;
  }

  return "todo";
};

const taskEstimate = (value: string | null | undefined): TaskEstimate | null => {
  if (value === "xs" || value === "s" || value === "m" || value === "l" || value === "xl") {
    return value;
  }

  return null;
};

const timestampToIso = (value: number | null | undefined): string | null =>
  typeof value === "number" ? new Date(value).toISOString() : null;

const mapTask = (task: Task, teamsById: ReadonlyMap<string, Team>): TaskCollectionItem => ({
  assignedUserId: task.assigned_user_id ?? null,
  boardOrder: task.board_order,
  churchId: task.church_id,
  createdAt: task.created_at ?? 0,
  createdByUserId: task.created_by_user_id ?? task.created_by ?? null,
  cycleId: task.cycle_id ?? "",
  description: task.description ?? null,
  dueDate: task.due_date ?? null,
  estimate: taskEstimate(task.estimate),
  finishedAt: timestampToIso(task.finished_at),
  id: task.id,
  identifier: formatTaskIdentifier(teamsById.get(task.team_id)?.identifier ?? "TEAM", task.number),
  labelIds: parseStringArray(task.label_ids),
  number: task.number,
  parentTaskId: task.parent_task_id ?? null,
  previousIdentifiers: parseStringArray(task.previous_identifiers),
  sourceTemplateCycleId: task.source_template_cycle_id ?? null,
  sourceTemplateId: task.source_template_id ?? null,
  sourceTemplateSyncEnabled: task.source_template_sync_enabled ?? false,
  sourceTemplateTaskId: task.source_template_task_id ?? null,
  taskState: taskStatus(task.task_state),
  teamId: task.team_id,
  title: task.title,
  workflowId: task.workflow_id,
  workflowStatusId: task.workflow_status_id,
});

const zeroMutationResult = async <Data>(
  run: () => {
    readonly server: Promise<{
      readonly type: string;
      readonly error?: { readonly message?: string };
      readonly value?: Data;
    }>;
  },
  fallbackMessage: string,
): MutationResult<Data> => {
  try {
    const result = await run().server;
    if (result.type === "error") {
      return { error: { message: result.error?.message ?? fallbackMessage }, ok: false };
    }
    return { data: result.value as Data, ok: true };
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : fallbackMessage },
      ok: false,
    };
  }
};

const taskFieldsToZero = (fields: TaskUpdateFields) => ({
  ...(fields.assignedUserId !== undefined ? { assigned_user_id: fields.assignedUserId } : {}),
  ...(fields.boardOrder !== undefined ? { board_order: fields.boardOrder } : {}),
  ...(fields.dueDate !== undefined ? { due_date: fields.dueDate } : {}),
  ...(fields.estimate !== undefined ? { estimate: fields.estimate } : {}),
  ...(fields.labelIds !== undefined ? { label_ids: [...fields.labelIds] } : {}),
  ...(fields.parentTaskId !== undefined ? { parent_task_id: fields.parentTaskId } : {}),
  ...(fields.teamId !== undefined ? { team_id: fields.teamId } : {}),
  ...(fields.title !== undefined ? { title: fields.title } : {}),
  ...(fields.workflowStatusId !== undefined ? { workflow_status_id: fields.workflowStatusId } : {}),
});

const taskFieldsToTestBody = (fields: TaskUpdateFields) => ({
  ...(fields.assignedUserId !== undefined ? { assigned_user_id: fields.assignedUserId } : {}),
  ...(fields.boardOrder !== undefined ? { board_order: fields.boardOrder } : {}),
  ...(fields.dueDate !== undefined ? { due_date: fields.dueDate } : {}),
  ...(fields.estimate !== undefined ? { estimate: fields.estimate } : {}),
  ...(fields.labelIds !== undefined ? { label_ids: [...fields.labelIds] } : {}),
  ...(fields.parentTaskId !== undefined ? { parent_task_id: fields.parentTaskId } : {}),
  ...(fields.teamId !== undefined ? { team_id: fields.teamId } : {}),
  ...(fields.title !== undefined ? { title: fields.title } : {}),
  ...(fields.workflowStatusId !== undefined ? { workflow_status_id: fields.workflowStatusId } : {}),
});

const testTaskMutation = async <Data>(
  body: Record<string, unknown>,
  fallbackMessage: string,
): MutationResult<Data> => {
  if (import.meta.env.MODE !== "e2e") return { ok: false, error: { message: "Not available." } };

  const response = await fetch("/api/test/task-mutation", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const result = (await response.json().catch(() => null)) as
    | ({ error?: string } & Partial<Data>)
    | null;
  if (!response.ok) {
    return { error: { message: result?.error ?? fallbackMessage }, ok: false };
  }

  return { data: (result ?? {}) as Data, ok: true };
};

export function useTasksCollection(params: {
  readonly churchId: string | null;
  readonly currentUserId: string | null;
  readonly filters?: TaskCollectionFilters;
  readonly listArgs?: ListArgs;
}) {
  const [taskRows] = useQuery(
    queries.tasks.filtered({
      assigned_user_id:
        params.filters?.surface === "my_work" ? (params.currentUserId ?? undefined) : undefined,
      church_id: params.churchId ?? "__no_church__",
      list_args: params.listArgs ?? {},
      team_id: params.filters?.teamId,
    }),
  );
  const activeTaskRows = taskRows ?? [];
  const [teamRows] = useQuery(
    queries.teams.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [serverRows, setServerRows] = useState<readonly TaskCollectionItem[]>([]);
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const collection =
    params.churchId === null ? [] : activeTaskRows.map((task) => mapTask(task, teamsById));
  const serverCollection = serverRows.filter(
    (task) =>
      (params.filters?.teamId === undefined || task.teamId === params.filters.teamId) &&
      (params.filters?.surface !== "my_work" || task.assignedUserId === params.currentUserId),
  );
  const visibleTasks =
    import.meta.env.MODE === "e2e" && serverCollection.length > 0
      ? serverCollection
      : collection.length > 0
        ? collection
        : serverCollection;

  useEffect(() => {
    if (params.churchId === null || (import.meta.env.MODE !== "e2e" && collection.length > 0)) {
      setServerRows([]);
      return;
    }

    const controller = new AbortController();
    const churchId = params.churchId;

    const fetchTasks = () => {
      void fetch(`/api/onboarding/tasks?churchId=${encodeURIComponent(churchId)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;

          const body = (await response.json()) as {
            readonly tasks?: readonly TaskCollectionItem[];
          };
          setServerRows(body.tasks ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 1_000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [params.churchId, collection.length]);

  return {
    loading: false,
    collection: visibleTasks,
    tasksCollection: visibleTasks,
  };
}

export function useCreateTaskMutation() {
  const zero = useZero();

  return async (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly title: string;
    readonly description?: string | null;
    readonly teamId: string;
    readonly assignedUserId?: string | null;
    readonly workflowStatusId: string;
    readonly dueDate?: string | null;
    readonly parentTaskId?: string | null;
    readonly labelIds?: readonly string[];
    readonly estimate?: TaskEstimate | null;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      const result = await testTaskMutation<{
        readonly tasks?: readonly { readonly id: string; readonly identifier: string }[];
      }>(
        {
          action: "create",
          assignedUserId: params.assignedUserId ?? null,
          churchId: params.churchId,
          description: params.description ?? null,
          dueDate: params.dueDate ?? null,
          estimate: params.estimate ?? null,
          labelIds: [...(params.labelIds ?? [])],
          parentTaskId: params.parentTaskId ?? null,
          teamId: params.teamId,
          title: params.title,
          workflowStatusId: params.workflowStatusId,
        },
        "Could not create Task.",
      );
      if (!result.ok) return result;
      return { data: { tasks: result.data.tasks ?? [] }, ok: true as const };
    }

    const result = await zeroMutationResult<{
      readonly tasks: readonly { readonly id: string; readonly identifier: string }[];
    }>(
      () =>
        zero.mutate(
          mutators.tasks.create({
            assigned_user_id: params.assignedUserId ?? null,
            church_id: params.churchId,
            description: params.description ?? null,
            due_date: params.dueDate ?? null,
            estimate: params.estimate ?? null,
            label_ids: [...(params.labelIds ?? [])],
            parent_task_id: params.parentTaskId ?? null,
            team_id: params.teamId,
            title: params.title,
            workflow_status_id: params.workflowStatusId,
          }),
        ),
      "Could not create Task.",
    );
    if (!result.ok) return result;
    return { data: result.data ?? { tasks: [] }, ok: true as const };
  };
}

export function useUpdateTaskMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly taskId: string;
    readonly fields: TaskUpdateFields;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTaskMutation(
        {
          action: "update",
          churchId: params.churchId,
          fields: taskFieldsToTestBody(params.fields),
          taskId: params.taskId,
        },
        "Could not update Task.",
      );
    }

    return zeroMutationResult(
      () =>
        zero.mutate(
          mutators.tasks.update({
            church_id: params.churchId,
            fields: taskFieldsToZero(params.fields),
            task_id: params.taskId,
          }),
        ),
      "Could not update Task.",
    );
  };
}

export function useUpdateTasksBatchMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly updates: readonly { readonly taskId: string; readonly fields: TaskUpdateFields }[];
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTaskMutation(
        {
          action: "update_batch",
          churchId: params.churchId,
          updates: params.updates.map((update) => ({
            fields: taskFieldsToTestBody(update.fields),
            taskId: update.taskId,
          })),
        },
        "Could not update Tasks.",
      );
    }

    return zeroMutationResult(
      () =>
        zero.mutate(
          mutators.tasks.update_batch({
            church_id: params.churchId,
            updates: params.updates.map((update) => ({
              fields: taskFieldsToZero(update.fields),
              task_id: update.taskId,
            })),
          }),
        ),
      "Could not update Tasks.",
    );
  };
}

export function useCompleteTaskMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly taskId: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTaskMutation(
        { action: "complete", churchId: params.churchId, taskId: params.taskId },
        "Could not complete Task.",
      );
    }

    return zeroMutationResult(
      () =>
        zero.mutate(
          mutators.tasks.complete({ church_id: params.churchId, task_id: params.taskId }),
        ),
      "Could not complete Task.",
    );
  };
}

export function useCancelTaskMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly taskId: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTaskMutation(
        { action: "cancel", churchId: params.churchId, taskId: params.taskId },
        "Could not cancel Task.",
      );
    }

    return zeroMutationResult(
      () =>
        zero.mutate(mutators.tasks.cancel({ church_id: params.churchId, task_id: params.taskId })),
      "Could not cancel Task.",
    );
  };
}

export function useReopenTaskMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly actorUserId: string | null;
    readonly taskId: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTaskMutation(
        { action: "reopen", churchId: params.churchId, taskId: params.taskId },
        "Could not reopen Task.",
      );
    }

    return zeroMutationResult(
      () =>
        zero.mutate(mutators.tasks.reopen({ church_id: params.churchId, task_id: params.taskId })),
      "Could not reopen Task.",
    );
  };
}
