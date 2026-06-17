import { queries, type Cycle } from "@church-task/zero";
import { useQuery } from "@rocicorp/zero/react";

export type CycleCollectionItem = {
  readonly id: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startsAt: number;
  readonly endsAt: number;
};

const mapCycle = (cycle: Cycle): CycleCollectionItem => ({
  endDate: cycle.end_date,
  endsAt: cycle.ends_at,
  id: cycle.id,
  startDate: cycle.start_date,
  startsAt: cycle.starts_at,
});

export function useCyclesCollection(params: {
  readonly churchId: string | null;
  readonly currentUserId: string | null;
}) {
  const [rows] = useQuery(
    queries.cycles.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const collection =
    params.churchId === null || params.currentUserId === null ? [] : rows.map(mapCycle);

  return {
    loading: false,
    collection,
    cyclesCollection: collection,
  };
}
