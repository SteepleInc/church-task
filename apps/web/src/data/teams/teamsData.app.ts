import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { successfulResponseCollection } from "@/data/convex-query-adapter";

export type TeamCollectionItem = {
  readonly id: string;
  readonly name: string;
  readonly defaultWorkflowId: string | null;
  readonly sortOrder: number;
};

export type TeamMembershipCollectionItem = {
  readonly id?: string;
  readonly teamId: string;
  readonly userId: string;
};

export function useTeamsCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.teams.listForChurch,
    params.churchId ? { churchId: params.churchId } : "skip",
  );
  const state = successfulResponseCollection(result, (response) =>
    "teams" in response.data ? response.data.teams : [],
  );

  return {
    loading: params.churchId !== null && state.loading,
    collection: state.collection as readonly TeamCollectionItem[],
    teamsCollection: state.collection as readonly TeamCollectionItem[],
  };
}

export function useTeamMembershipsCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.teams.listMembershipsForChurch,
    params.churchId ? { churchId: params.churchId } : "skip",
  );
  const state = successfulResponseCollection(result, (response) =>
    "teamMemberships" in response.data
      ? (response.data.teamMemberships as readonly TeamMembershipCollectionItem[])
      : [],
  );

  return {
    loading: params.churchId !== null && state.loading,
    collection: state.collection,
    teamMembershipsCollection: state.collection,
  };
}
