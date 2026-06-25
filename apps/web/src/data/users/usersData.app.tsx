import { queries, type Member, type Organization, type User } from "@church-work/zero";
import { useQuery } from "@rocicorp/zero/react";

import { useChurchId } from "@/data/useChurchId";
import { useTeamMembershipsCollection, useTeamsCollection } from "@/data/teams/teamsData.app";
import { authClient } from "@/lib/auth-client";
import { FilterKeys } from "@/shared/global-state";
import { useZeroListArgs } from "@/shared/hooks/useZeroListArgs";
import { useSession } from "@/hooks/use-session";

export type UserCollectionItem = {
  readonly id: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly image?: string | null;
  readonly createdAt?: number;
  readonly memberId?: string;
  readonly role?: string;
  readonly churches: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string | null;
    readonly role: string;
  }[];
};

export function getUserDisplayName(user: Pick<UserCollectionItem, "id" | "name" | "email">) {
  const name = user.name?.trim();
  if (name) return name;

  const email = user.email?.trim();
  return email || user.id;
}

export function useChurchUsersCollection(params: { readonly churchId: string | null }) {
  const { data: activeOrg, isPending: activeOrgPending } = authClient.useActiveOrganization();
  const session = authClient.useSession();
  const members = activeOrg?.id === params.churchId ? (activeOrg.members ?? []) : [];
  const collection = members.map((member) => {
    const user = "user" in member ? member.user : null;
    const id = user?.id ?? member.userId;
    const email = user?.email ?? (id === session.data?.user?.id ? session.data.user.email : null);
    const name = user?.name ?? (id === session.data?.user?.id ? session.data.user.name : null);

    return {
      id,
      name,
      email,
      image: user?.image ?? null,
      memberId: member.id,
      role: member.role,
      churches: [],
    } satisfies UserCollectionItem;
  });

  return {
    loading: params.churchId !== null && (activeOrgPending || session.isPending),
    collection,
    usersCollection: collection,
  };
}

/**
 * The rich Member identity the assignee hover card renders: avatar, name, an
 * email/username subtitle, the org Role, and the Member's Teams. Mirrors
 * Linear's profile popover with the fields we actually track (presence + local
 * time are intentionally omitted).
 */
export type AssigneeProfile = {
  readonly userId: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly image: string | null;
  readonly role: string | null;
  readonly teamNames: readonly string[];
};

/**
 * Resolves a single Member's rich profile for the assignee hover card, reading
 * the active Church from ambient context so callers only pass a `userId`. The
 * three Zero/Better-Auth sources it composes (Church members, Team memberships,
 * Teams) are all Church-scoped, so every instance of this hook shares the same
 * queries — they collapse to one subscription each no matter how many assignee
 * tooltips are mounted. Returns `null` for a missing/unassigned user (the card
 * then renders its "No assignee" state).
 */
export function useTaskAssigneeProfile(userId: string | null): AssigneeProfile | null {
  const churchId = useChurchId();
  const { usersCollection } = useChurchUsersCollection({ churchId });
  const { teamMembershipsCollection } = useTeamMembershipsCollection({ churchId });
  const { teamsCollection } = useTeamsCollection({ churchId });

  if (userId === null) return null;
  const user = usersCollection.find((candidate) => candidate.id === userId);
  if (!user) return null;

  const teamNamesById = new Map(teamsCollection.map((team) => [team.id, team.name]));
  const teamNames = teamMembershipsCollection
    .filter((membership) => membership.userId === userId)
    .map((membership) => teamNamesById.get(membership.teamId))
    .filter((name): name is string => name !== undefined);

  const name = getUserDisplayName(user);
  // The subtitle is the email when it differs from the display name (which
  // already falls back to the email/id when there's no name).
  const subtitle = user.email && user.email !== name ? user.email : null;

  return {
    userId: user.id,
    name,
    subtitle,
    image: user.image ?? null,
    role: user.role ?? null,
    teamNames,
  };
}

const userColumnMap = {
  createdAt: "created_at",
} as const;

export const mapAdminUser = (
  user: User,
  members: readonly Member[],
  orgsById: ReadonlyMap<string, Organization>,
): UserCollectionItem => ({
  id: user.id,
  name: user.name,
  email: user.email,
  image: user.image ?? null,
  createdAt: user.createdAt ?? undefined,
  role: user.role ?? undefined,
  churches: members
    .filter((member) => member.userId === user.id)
    .map((member) => {
      const org = orgsById.get(member.organizationId);

      return {
        id: member.organizationId,
        name: org?.name ?? member.organizationId,
        role: member.role,
        slug: org?.slug ?? null,
      };
    }),
});

export function useAllUsersCollectionWithFilters() {
  const { session } = useSession();
  const isAppAdmin =
    (session as { user?: { role?: string | null } } | null)?.user?.role === "admin" ||
    (session as { session?: { userRole?: string | null } } | null)?.session?.userRole === "admin";
  const { limit, listArgs, nextPage, pageSize } = useZeroListArgs({
    columnMap: userColumnMap,
    filterKey: FilterKeys.Users,
  });
  const [userRows = []] = useQuery(
    isAppAdmin ? queries.user.admin_list({ list_args: listArgs }) : undefined,
  );
  const [memberRows = []] = useQuery(isAppAdmin ? queries.member.admin_all() : undefined);
  const [orgRows = []] = useQuery(
    isAppAdmin ? queries.organization.admin_list({ list_args: { limit: 500 } }) : undefined,
  );
  const orgsById = new Map(orgRows.map((org) => [org.id, org]));
  const usersCollection = userRows.map((user) => mapAdminUser(user, memberRows, orgsById));

  return {
    canLoadMore: userRows.length >= limit,
    limit,
    loading: false,
    loadingMore: false,
    nextPage,
    pageSize,
    usersCollection,
  };
}
