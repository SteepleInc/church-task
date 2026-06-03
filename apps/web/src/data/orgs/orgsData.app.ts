import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { collectionFromQueryResult } from "@/data/convex-query-adapter";

export type OrgCollectionItem = {
  readonly id: string;
  readonly name: string;
  readonly slug: string | null;
  readonly churchTimeZone: string | null;
};

export function useUserOrgsCollection() {
  const result = useQuery(api.dashboard.listOrganizations);
  const state = collectionFromQueryResult<OrgCollectionItem>(result);

  return {
    loading: state.loading,
    collection: state.collection,
    orgsCollection: state.collection,
  };
}

export const useOrgsCollection = useUserOrgsCollection;
