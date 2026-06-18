import { getLabelColorForName } from "@church-task/domain";
import { getLabelId } from "@church-task/shared/get-ids";
import { mutators, queries, type Label, type Task } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

export type LabelItem = {
  readonly id: string;
  readonly churchId: string;
  readonly teamId: string | null;
  readonly name: string;
  readonly color: string;
  // Epoch ms of the Label's creation.
  readonly createdAt: number;
  // Number of Tasks currently carrying this Label.
  readonly taskCount: number;
  // ISO timestamp of the most recent application to a Task, or null.
  readonly lastAppliedAt: string | null;
};

type LabelMutationResult<Data = undefined> = Promise<
  | { readonly ok: true; readonly data: Data }
  | { readonly ok: false; readonly error: { readonly message: string } }
>;
type ZeroMutationResult = {
  readonly server: Promise<
    | { readonly type: "success" }
    | { readonly type: "error"; readonly error: { readonly message: string } }
  >;
};

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

const mutationResult = async (run: () => ZeroMutationResult): LabelMutationResult => {
  try {
    const result = await run().server;
    if (result.type === "error") {
      return { error: { message: result.error.message }, ok: false };
    }

    return { data: undefined, ok: true };
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : "Could not update Labels." },
      ok: false,
    };
  }
};

const mapLabel = (label: Label, tasks: readonly Task[]): LabelItem => {
  const matchingTasks = tasks.filter((task) => parseStringArray(task.label_ids).includes(label.id));

  return {
    churchId: label.church_id,
    color: label.color,
    createdAt: label.created_at ?? 0,
    id: label.id,
    lastAppliedAt: null,
    name: label.name,
    taskCount: matchingTasks.length,
    teamId: label.team_id ?? null,
  };
};

const testLabelMutation = async (body: {
  readonly action: "create" | "delete" | "update";
  readonly churchId: string;
  readonly color?: string;
  readonly labelId?: string;
  readonly name?: string;
}): LabelMutationResult => {
  if (import.meta.env.MODE !== "e2e") return { ok: false, error: { message: "Not available." } };

  const response = await fetch("/api/test/label-mutation", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: { message: result?.error ?? "Could not update Labels." }, ok: false };
  }

  return { data: undefined, ok: true };
};

/**
 * Church Labels ride along on the work-defaults read (like Workflows), so the
 * picker, cards, and settings page share one cached query.
 */
export function useLabelsCollection(params: { readonly churchId: string | null }) {
  const [labelRows] = useQuery(
    queries.labels.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [taskRows] = useQuery(
    queries.tasks.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [serverRows, setServerRows] = useState<readonly LabelItem[]>([]);
  const collection =
    params.churchId === null ? [] : labelRows.map((label) => mapLabel(label, taskRows));
  const visibleLabels =
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

    const fetchLabels = () => {
      void fetch(`/api/onboarding/labels?churchId=${encodeURIComponent(churchId)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;

          const body = (await response.json()) as { readonly labels?: readonly LabelItem[] };
          setServerRows(body.labels ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    };

    fetchLabels();
    const interval = setInterval(fetchLabels, 1_000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [params.churchId, collection.length]);

  return {
    collection: visibleLabels,
    labelsCollection: visibleLabels,
    loading: false,
  };
}

export function useCreateLabelMutation() {
  const zero = useZero();

  return async (params: { readonly churchId: string; readonly name: string }) => {
    const labelId = getLabelId();
    const result =
      import.meta.env.MODE === "e2e"
        ? await testLabelMutation({
            action: "create",
            churchId: params.churchId,
            labelId,
            name: params.name,
          })
        : await mutationResult(() =>
            zero.mutate(
              mutators.labels.create({
                church_id: params.churchId,
                label_id: labelId,
                name: params.name,
              }),
            ),
          );
    if (!result.ok) return result;

    return {
      data: {
        labels: [
          {
            churchId: params.churchId,
            color: getLabelColorForName(params.name),
            createdAt: Date.now(),
            id: labelId,
            lastAppliedAt: null,
            name: params.name,
            taskCount: 0,
            teamId: null,
          },
        ],
      },
      ok: true as const,
    };
  };
}

export function useUpdateLabelMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly labelId: string;
    readonly name?: string;
    readonly color?: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testLabelMutation({
        action: "update",
        churchId: params.churchId,
        color: params.color,
        labelId: params.labelId,
        name: params.name,
      });
    }

    return mutationResult(() =>
      zero.mutate(
        mutators.labels.update({
          church_id: params.churchId,
          color: params.color,
          label_id: params.labelId,
          name: params.name,
        }),
      ),
    );
  };
}

export function useDeleteLabelMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly labelId: string }) => {
    if (import.meta.env.MODE === "e2e") {
      return testLabelMutation({
        action: "delete",
        churchId: params.churchId,
        labelId: params.labelId,
      });
    }

    return mutationResult(() =>
      zero.mutate(mutators.labels.delete({ church_id: params.churchId, label_id: params.labelId })),
    );
  };
}
