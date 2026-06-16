import { api } from "@church-task/backend-old/convex/_generated/api";
import { useMutation } from "convex/react";

import { collectionFromQueryResult } from "@/data/convex-query-adapter";
import { useConvexQuery as useQuery } from "@/data/query-hooks";

/**
 * A Church Member as rendered by the workspace Members settings table. This is
 * the enriched shape returned by `dashboard.listMembers`: identity (name,
 * username, email, avatar), the org role, suspension status, and the activity
 * fields Linear surfaces (Teams, Joined, Last seen).
 */
export type MemberItem = {
  readonly memberId: string;
  readonly userId: string;
  readonly name: string | null;
  readonly username: string | null;
  readonly email: string | null;
  readonly image: string | null;
  readonly role: string;
  readonly suspended: boolean;
  readonly joinedAt: number | null;
  readonly lastSeenAt: number | null;
  readonly teamIds: readonly string[];
};

export function useMembersCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.dashboard.listMembers,
    params.churchId ? { organizationId: params.churchId } : "skip",
  );
  const state = collectionFromQueryResult(
    result?.map(
      (member): MemberItem => ({
        memberId: member.id,
        userId: member.user.id,
        name: member.user.name,
        username: member.user.username ?? null,
        email: member.user.email,
        image: member.user.image ?? null,
        role: member.role,
        suspended: member.user.suspended ?? false,
        joinedAt: member.joinedAt ?? null,
        lastSeenAt: member.user.lastSeenAt ?? null,
        teamIds: member.teamIds ?? [],
      }),
    ),
  );

  return {
    loading: params.churchId !== null && state.loading,
    membersCollection: state.collection,
  };
}

export function useUpdateMemberNameMutation() {
  return useMutation(api.dashboard.updateMemberName);
}

export function useUpdateMemberUsernameMutation() {
  return useMutation(api.dashboard.updateMemberUsername);
}

export function useUpdateMemberEmailMutation() {
  return useMutation(api.dashboard.updateMemberEmail);
}

export function useSetMemberSuspendedMutation() {
  return useMutation(api.dashboard.setMemberSuspended);
}
