import { queries, type Activity } from "@church-work/zero";
import { useQuery } from "@rocicorp/zero/react";

export type ActivityEntityType =
  | "task"
  | "template"
  | "cycle"
  | "team"
  | "workflow"
  | "key_date"
  | "church";

export type ActivityCollectionItem = Activity;

export function useActivitiesForEntityCollection(params: {
  readonly churchId: string | null;
  readonly entityType: ActivityEntityType;
  readonly entityId: string | null;
}) {
  const [rows, result] = useQuery(
    queries.activities.by_entity({
      church_id: params.churchId ?? "__no_church__",
      entity_id: params.entityId ?? "__no_entity__",
      entity_type: params.entityType,
    }),
  );

  return {
    loading: params.churchId !== null && params.entityId !== null && result.type !== "complete",
    collection: rows as readonly ActivityCollectionItem[],
    activitiesCollection: rows as readonly ActivityCollectionItem[],
  };
}
