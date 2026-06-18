import { queries, mutators } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";

export type OnboardingTeamCollectionItem = {
  readonly id: string;
  readonly name: string;
  readonly identifier: string;
  readonly color: string;
  readonly sortOrder: number;
};

export function useOnboardingTeamsCollection(params: { readonly churchId: string }) {
  const [rows] = useQuery(queries.teams.by_church({ church_id: params.churchId }));
  const teamsCollection = rows.map((team) => ({
    color: team.color,
    id: team.id,
    identifier: team.identifier,
    name: team.name,
    sortOrder: team.sort_order,
  }));

  return {
    collection: teamsCollection,
    loading: false,
    teamsCollection,
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
