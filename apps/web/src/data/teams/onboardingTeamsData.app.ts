import { queries, mutators } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

export type OnboardingTeamCollectionItem = {
  readonly id: string;
  readonly name: string;
  readonly identifier: string;
  readonly color: string;
  readonly sortOrder: number;
};

export function useOnboardingTeamsCollection(params: { readonly churchId: string }) {
  const [rows] = useQuery(queries.teams.by_church({ church_id: params.churchId }));
  const [serverRows, setServerRows] = useState<readonly OnboardingTeamCollectionItem[]>([]);
  const teamsCollection = rows.map((team) => ({
    color: team.color,
    id: team.id,
    identifier: team.identifier,
    name: team.name,
    sortOrder: team.sort_order,
  }));
  const visibleTeams = teamsCollection.length > 0 ? teamsCollection : serverRows;

  useEffect(() => {
    if (teamsCollection.length > 0) {
      setServerRows([]);
      return;
    }

    const controller = new AbortController();

    void fetch(`/api/onboarding/teams?churchId=${encodeURIComponent(params.churchId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;

        const body = (await response.json()) as {
          readonly teams?: readonly OnboardingTeamCollectionItem[];
        };
        setServerRows(body.teams ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [params.churchId, teamsCollection.length]);

  return {
    collection: visibleTeams,
    loading: false,
    teamsCollection: visibleTeams,
  };
}

export function useDeleteOnboardingTeamMutation() {
  const zero = useZero();

  return async (params: { readonly churchId: string; readonly teamId: string }) => {
    await zero.mutate(
      mutators.teams.delete({
        church_id: params.churchId,
        team_id: params.teamId,
      }),
    );

    return { ok: true } as const;
  };
}
