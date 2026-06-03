import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { collectionFromQueryResult } from "@/data/convex-query-adapter";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";

export type InvitationCollectionItem = {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
  readonly organizationName?: string;
};

export function useOrgInvitations() {
  const { currentOrgOpt, loading } = useCurrentOrgOpt();
  const state = collectionFromQueryResult<InvitationCollectionItem>(currentOrgOpt?.invitations);

  return {
    loading: loading || state.loading,
    collection: state.collection,
    invitationsCollection: state.collection,
  };
}

export function usePendingInvitationsCount() {
  const invitations = useOrgInvitations();

  return {
    loading: invitations.loading,
    count: invitations.invitationsCollection.filter((invitation) => invitation.status === "pending")
      .length,
  };
}

export function useUserInvitationsCollection() {
  const result = useQuery(api.dashboard.listUserInvitations);
  const state = collectionFromQueryResult<InvitationCollectionItem>(result);

  return {
    loading: state.loading,
    collection: state.collection,
    invitationsCollection: state.collection,
  };
}
