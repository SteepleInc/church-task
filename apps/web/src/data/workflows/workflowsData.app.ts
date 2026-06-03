import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { successfulResponseCollection } from "@/data/convex-query-adapter";

export function useWorkflowsCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.workDefaults.readForChurch,
    params.churchId ? { churchId: params.churchId } : "skip",
  );
  const state = successfulResponseCollection(result, (response) => response.data.workflows);

  return {
    loading: params.churchId !== null && state.loading,
    collection: state.collection,
    workflowsCollection: state.collection,
  };
}

export function useWorkflowStatusesCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.workDefaults.readForChurch,
    params.churchId ? { churchId: params.churchId } : "skip",
  );
  const state = successfulResponseCollection(result, (response) => response.data.workflowStatuses);

  return {
    loading: params.churchId !== null && state.loading,
    collection: state.collection,
    workflowStatusesCollection: state.collection,
  };
}
