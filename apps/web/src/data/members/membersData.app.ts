import { queries } from "@church-work/zero";
import { useQuery } from "@rocicorp/zero/react";

import { authClient } from "@/lib/auth-client";

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

const timestampFromDateLike = (value: Date | number | string | null | undefined) => {
  if (!value) return null;

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export function useMembersCollection(params: { readonly churchId: string | null }) {
  const { data: activeOrg, isPending: activeOrgPending } = authClient.useActiveOrganization();
  const [teamMembershipRows] = useQuery(
    queries.team_memberships.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const members = activeOrg?.id === params.churchId ? (activeOrg.members ?? []) : [];
  const collection = members.map((member): MemberItem => {
    const user = "user" in member ? member.user : null;
    const userWithAdminFields = user as (typeof user & { readonly banned?: boolean }) | null;
    const userId = user?.id ?? member.userId;

    return {
      email: user?.email ?? null,
      image: user?.image ?? null,
      joinedAt: timestampFromDateLike(member.createdAt),
      lastSeenAt: null,
      memberId: member.id,
      name: user?.name ?? null,
      role: member.role,
      suspended: Boolean(userWithAdminFields?.banned),
      teamIds: teamMembershipRows
        .filter((teamMembership) => teamMembership.user_id === userId)
        .map((teamMembership) => teamMembership.team_id),
      userId,
      username: null,
    };
  });

  return {
    loading: params.churchId !== null && activeOrgPending,
    membersCollection: collection,
  };
}

const unsupportedMemberProfileMutation = async (_params: unknown) => {
  throw new Error("Member profile updates are not available in the new membership stack yet.");
};

export function useUpdateMemberNameMutation() {
  return unsupportedMemberProfileMutation;
}

export function useUpdateMemberUsernameMutation() {
  return unsupportedMemberProfileMutation;
}

export function useUpdateMemberEmailMutation() {
  return unsupportedMemberProfileMutation;
}

export function useSetMemberSuspendedMutation() {
  return unsupportedMemberProfileMutation;
}
