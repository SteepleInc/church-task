import {
  mutators,
  queries,
  type Team,
  type Workflow,
  type WorkflowStatus,
} from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

type TaskStatus = "todo" | "in_progress" | "done" | "canceled";

type WorkflowItem = {
  readonly id: string;
  // Every Team owns its Workflow (ADR 0013): the owning Team's id.
  readonly teamId: string;
  readonly key: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly archivedAt: string | null;
};

type WorkflowStatusItem = {
  readonly id: string;
  readonly workflowId: string;
  readonly key: string;
  readonly name: string;
  readonly taskState: TaskStatus;
  readonly sortOrder: number;
  readonly archivedAt: string | null;
};

type ServerWorkflowPayload = {
  readonly workflows?: readonly WorkflowItem[];
  readonly statuses?: readonly WorkflowStatusItem[];
};

type MutationResult = Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: { readonly message: string } }
>;
type ZeroMutationResult = {
  readonly server: Promise<
    | { readonly type: "success" }
    | { readonly type: "error"; readonly error: { readonly message: string } }
  >;
};

const mutationResult = async (run: () => ZeroMutationResult): MutationResult => {
  try {
    const result = await run().server;

    if (result.type === "error") {
      return { error: { message: result.error.message }, ok: false };
    }

    return { ok: true };
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : "Could not update Workflows." },
      ok: false,
    };
  }
};

const workflowKey = (workflow: Workflow): string => workflow.team_id;

const taskStatus = (value: string): TaskStatus => {
  if (value === "todo" || value === "in_progress" || value === "done" || value === "canceled") {
    return value;
  }

  return "todo";
};

const deletedAt = (value: number | null | undefined): string | null =>
  typeof value === "number" ? new Date(value).toISOString() : null;

const mapWorkflow = (workflow: Workflow, teamsById: ReadonlyMap<string, Team>): WorkflowItem => ({
  archivedAt: deletedAt(workflow.deleted_at),
  id: workflow.id,
  key: workflowKey(workflow),
  name: workflow.name,
  sortOrder: teamsById.get(workflow.team_id)?.sort_order ?? 0,
  teamId: workflow.team_id,
});

const mapWorkflowStatus = (status: WorkflowStatus): WorkflowStatusItem => ({
  archivedAt: deletedAt(status.deleted_at),
  id: status.id,
  key: status.key,
  name: status.name,
  sortOrder: status.sort_order,
  taskState: taskStatus(status.task_state),
  workflowId: status.workflow_id,
});

export function useWorkflowsCollection(params: { readonly churchId: string | null }) {
  const [workflowRows] = useQuery(
    queries.workflows.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [teamRows] = useQuery(
    queries.teams.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [serverRows, setServerRows] = useState<readonly WorkflowItem[]>([]);
  const teamsById = new Map(teamRows.map((team) => [team.id, team]));
  const collection =
    params.churchId === null
      ? []
      : workflowRows
          .map((workflow) => mapWorkflow(workflow, teamsById))
          .sort((left, right) => left.sortOrder - right.sortOrder);
  const visibleWorkflows =
    import.meta.env.MODE === "e2e" && serverRows.length > 0
      ? serverRows
      : collection.length > 0
        ? collection
        : serverRows;

  useEffect(() => {
    if (params.churchId === null || (import.meta.env.MODE !== "e2e" && collection.length > 0)) {
      setServerRows([]);
      return;
    }

    const controller = new AbortController();
    const churchId = params.churchId;

    const fetchWorkflows = () => {
      void fetch(`/api/onboarding/workflows?churchId=${encodeURIComponent(churchId)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;

          const body = (await response.json()) as ServerWorkflowPayload;
          setServerRows(body.workflows ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    };

    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 1_000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [params.churchId, collection.length]);

  return {
    loading: false,
    collection: visibleWorkflows,
    workflowsCollection: visibleWorkflows,
  };
}

export function useWorkflowStatusesCollection(params: { readonly churchId: string | null }) {
  const [rows] = useQuery(
    queries.workflow_statuses.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [serverRows, setServerRows] = useState<readonly WorkflowStatusItem[]>([]);
  const collection = params.churchId === null ? [] : rows.map(mapWorkflowStatus);
  const visibleStatuses =
    import.meta.env.MODE === "e2e" && serverRows.length > 0
      ? serverRows
      : collection.length > 0
        ? collection
        : serverRows;

  useEffect(() => {
    if (params.churchId === null || (import.meta.env.MODE !== "e2e" && collection.length > 0)) {
      setServerRows([]);
      return;
    }

    const controller = new AbortController();
    const churchId = params.churchId;

    const fetchStatuses = () => {
      void fetch(`/api/onboarding/workflows?churchId=${encodeURIComponent(churchId)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;

          const body = (await response.json()) as ServerWorkflowPayload;
          setServerRows(body.statuses ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 1_000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [params.churchId, collection.length]);

  return {
    loading: false,
    collection: visibleStatuses,
    workflowStatusesCollection: visibleStatuses,
  };
}

export function useRenameWorkflowMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly name: string;
    readonly workflowId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.rename({
          church_id: params.churchId,
          name: params.name,
          workflow_id: params.workflowId,
        }),
      ),
    );
}

export function useReorderWorkflowsMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly workflowIds: readonly string[] }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.reorder({
          church_id: params.churchId,
          workflow_ids: [...params.workflowIds],
        }),
      ),
    );
}

export function useArchiveWorkflowMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly workflowId: string }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.archive({
          church_id: params.churchId,
          workflow_id: params.workflowId,
        }),
      ),
    );
}

export function useAddWorkflowStatusMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly workflowId: string;
    readonly status: {
      readonly key: string;
      readonly name: string;
      readonly taskState: TaskStatus;
      readonly sortOrder: number;
    };
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.add_status({
          church_id: params.churchId,
          status: {
            key: params.status.key,
            name: params.status.name,
            sort_order: params.status.sortOrder,
            task_state: params.status.taskState,
          },
          workflow_id: params.workflowId,
        }),
      ),
    );
}

export function useRenameWorkflowStatusMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly name: string;
    readonly statusId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.rename_status({
          church_id: params.churchId,
          name: params.name,
          status_id: params.statusId,
        }),
      ),
    );
}

export function useReorderWorkflowStatusesMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly statusIds: readonly string[];
    readonly workflowId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.reorder_statuses({
          church_id: params.churchId,
          status_ids: [...params.statusIds],
          workflow_id: params.workflowId,
        }),
      ),
    );
}

export function useArchiveWorkflowStatusMutation() {
  const zero = useZero();

  return (params: {
    readonly archivedAt?: string;
    readonly churchId: string;
    readonly statusId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.workflows.archive_status({
          church_id: params.churchId,
          status_id: params.statusId,
        }),
      ),
    );
}
