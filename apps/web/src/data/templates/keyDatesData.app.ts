import { calculateKeyDateOccurrence, type KeyDateRule } from "@church-task/domain";
import { queries, mutators } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useCallback } from "react";

export type KeyDateItem = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly schedule: KeyDateRule;
  readonly nextOccurrence: string | null;
};

const parseSchedule = (value: string): KeyDateRule => JSON.parse(value) as KeyDateRule;

const nextOccurrenceForSchedule = (schedule: KeyDateRule, today = new Date()) => {
  const year = today.getUTCFullYear();
  const todayLocalDate = today.toISOString().slice(0, 10);
  for (const candidateYear of [year, year + 1]) {
    const occurrence = calculateKeyDateOccurrence(schedule, candidateYear);
    if (occurrence && occurrence >= todayLocalDate) return occurrence;
  }
  return null;
};

export function useKeyDatesCollection(params: { readonly churchId: string }) {
  const [rows] = useQuery(queries.key_dates.by_church({ church_id: params.churchId }));
  const collection = rows.map((row) => {
    const schedule = parseSchedule(row.schedule);
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      nextOccurrence: nextOccurrenceForSchedule(schedule),
      schedule,
    };
  });

  return { collection, keyDatesCollection: collection, loading: false };
}

export function useCreateKeyDate() {
  const zero = useZero();
  return useCallback(
    async (params: {
      readonly churchId: string;
      readonly key: string;
      readonly name: string;
      readonly schedule: KeyDateRule;
    }) => {
      await zero.mutate(
        mutators.key_dates.create({
          church_id: params.churchId,
          key: params.key,
          name: params.name,
          schedule: params.schedule,
        }),
      );
    },
    [zero],
  );
}

export function useUpdateKeyDate() {
  const zero = useZero();
  return useCallback(
    async (params: {
      readonly churchId: string;
      readonly keyDateId: string;
      readonly key: string;
      readonly name: string;
      readonly schedule: KeyDateRule;
    }) => {
      await zero.mutate(
        mutators.key_dates.update({
          church_id: params.churchId,
          key: params.key,
          key_date_id: params.keyDateId,
          name: params.name,
          schedule: params.schedule,
        }),
      );
    },
    [zero],
  );
}

export function useDeleteKeyDate() {
  const zero = useZero();
  return useCallback(
    async (params: { readonly churchId: string; readonly keyDateId: string }) => {
      await zero.mutate(
        mutators.key_dates.delete({ church_id: params.churchId, key_date_id: params.keyDateId }),
      );
    },
    [zero],
  );
}
