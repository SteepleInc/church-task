import { recordFromCollection } from "@/data/convex-query-adapter";
import { useOrgInvitations } from "@/data/invitations/invitationsData.app";

export function useInvitationData(params: { readonly invitationId: string }) {
  const invitations = useOrgInvitations();
  const state = recordFromCollection(
    invitations,
    (invitation) => invitation.id === params.invitationId,
  );

  return {
    loading: state.loading,
    invitationOpt: state.record,
  };
}
