import { useOrgInvitations } from "@/data/invitations/invitationsData.app";

export function useInvitationData(params: { readonly invitationId: string }) {
  const invitations = useOrgInvitations();

  return {
    loading: invitations.loading,
    invitationOpt:
      invitations.invitationsCollection.find(
        (invitation) => invitation.id === params.invitationId,
      ) ?? null,
  };
}
