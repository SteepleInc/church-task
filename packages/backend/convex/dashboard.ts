import { v } from "convex/values";

import { authComponent } from "../authCore";
import { components } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

type BetterAuthSession = {
  readonly activeOrganizationId?: string | null;
};

type BetterAuthOrganization = {
  readonly _id: string;
  readonly name: string;
  readonly slug?: string | null;
  readonly churchTimeZone?: string | null;
  readonly completedOnboarding?: boolean | null;
  readonly url?: string | null;
  readonly street?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly zip?: string | null;
  readonly countryCode?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly size?: string | null;
};

type BetterAuthMember = {
  readonly _id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: string;
  readonly createdAt?: number | null;
};

type BetterAuthUser = {
  readonly _id: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly image?: string | null;
  readonly username?: string | null;
  readonly displayUsername?: string | null;
  readonly banned?: boolean | null;
  readonly createdAt?: number | null;
};

type BetterAuthSessionRow = {
  readonly _id: string;
  readonly userId: string;
  readonly updatedAt?: number | null;
  readonly createdAt?: number | null;
};

type BetterAuthTeamRow = {
  readonly _id: string;
  readonly organizationId: string;
  readonly archivedAt?: string | null;
};

type BetterAuthTeamMemberRow = {
  readonly _id: string;
  readonly teamId: string;
  readonly userId: string;
};

type BetterAuthInvitation = {
  readonly _id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly role?: string | null;
  readonly status: string;
};

type BetterAuthModel =
  | "member"
  | "organization"
  | "session"
  | "user"
  | "invitation"
  | "team"
  | "teamMember";

type BetterAuthWhere = {
  readonly field: string;
  readonly operator?: "eq" | "gt" | "in";
  readonly value: string | number | boolean | Array<string> | Array<number> | null;
};

async function findOne<T>(
  ctx: QueryCtx,
  args: {
    readonly model: BetterAuthModel;
    readonly where: Array<BetterAuthWhere>;
  },
) {
  return (await ctx.runQuery(components.betterAuth.adapter.findOne, args)) as T | null;
}

async function findMany<T>(
  ctx: QueryCtx,
  args: {
    readonly model: BetterAuthModel;
    readonly where: Array<BetterAuthWhere>;
  },
) {
  const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    ...args,
    paginationOpts: { cursor: null, numItems: 1000 },
  })) as { readonly page: ReadonlyArray<T> };

  return result.page;
}

const isOrgAdminRole = (role: string | null | undefined): boolean =>
  role === "owner" || role === "admin";

/**
 * Resolves the caller's membership in the given Church and asserts they are an
 * owner/admin before any member-management mutation runs. Returns the caller's
 * auth user so callers can disallow self-targeting suspends.
 */
async function assertOrgAdmin(ctx: MutationCtx, organizationId: string) {
  const authUser = await getAuthUser(ctx);

  if (!authUser) {
    throw new Error("Authentication is required.");
  }

  const membership = await findOne<BetterAuthMember>(ctx, {
    model: "member",
    where: [
      { field: "organizationId", value: organizationId },
      { field: "userId", value: authUser._id },
    ],
  });

  if (!membership) {
    throw new Error("Church membership is required.");
  }

  if (!isOrgAdminRole(membership.role)) {
    throw new Error("Only Church owners and admins can manage members.");
  }

  return { authUser, membership };
}

/**
 * Confirms the target member belongs to the given Church and returns the member
 * + its user. Member-management mutations operate via memberId so they can only
 * touch users who are part of the caller's Church.
 */
async function getChurchMember(
  ctx: MutationCtx,
  args: { readonly organizationId: string; readonly memberId: string },
) {
  const member = await findOne<BetterAuthMember>(ctx, {
    model: "member",
    where: [{ field: "_id", value: args.memberId }],
  });

  if (!member || member.organizationId !== args.organizationId) {
    throw new Error("Church Member was not found.");
  }

  const user = await findOne<BetterAuthUser>(ctx, {
    model: "user",
    where: [{ field: "_id", value: member.userId }],
  });

  if (!user) {
    throw new Error("Church Member was not found.");
  }

  return { member, user };
}

async function getAuthUser(ctx: QueryCtx) {
  return await authComponent.safeGetAuthUser(ctx);
}

async function getActiveChurchId(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.sessionId) {
    return null;
  }

  const session = await findOne<BetterAuthSession>(ctx, {
    model: "session",
    where: [
      { field: "_id", value: String(identity.sessionId) },
      { field: "expiresAt", operator: "gt", value: Date.now() },
    ],
  });

  return session?.activeOrganizationId ?? null;
}

export const listUserInvitations = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUser(ctx);

    if (!authUser?.email) {
      return [];
    }

    const invitations = await findMany<BetterAuthInvitation>(ctx, {
      model: "invitation",
      where: [
        { field: "email", value: authUser.email },
        { field: "status", value: "pending" },
      ],
    });

    return await Promise.all(
      invitations.map(async (invitation) => {
        const organization = await findOne<BetterAuthOrganization>(ctx, {
          model: "organization",
          where: [{ field: "_id", value: invitation.organizationId }],
        });

        return {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role ?? "member",
          status: invitation.status,
          organizationName: organization?.name ?? "Unknown Church",
        };
      }),
    );
  },
});

export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUser(ctx);

    if (!authUser) {
      return [];
    }

    const memberships = await findMany<BetterAuthMember>(ctx, {
      model: "member",
      where: [{ field: "userId", value: authUser._id }],
    });

    return await Promise.all(
      memberships.map(async (membership) => {
        const organization = await findOne<BetterAuthOrganization>(ctx, {
          model: "organization",
          where: [{ field: "_id", value: membership.organizationId }],
        });

        return organization
          ? {
              id: organization._id,
              name: organization.name,
              slug: organization.slug ?? null,
              churchTimeZone: organization.churchTimeZone ?? null,
              completedOnboarding: organization.completedOnboarding ?? false,
            }
          : null;
      }),
    ).then((organizations) => organizations.filter((organization) => organization !== null));
  },
});

export const getActiveOrganization = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUser(ctx);
    const activeOrganizationId = await getActiveChurchId(ctx);

    if (!authUser || !activeOrganizationId) {
      return null;
    }

    const membership = await findOne<BetterAuthMember>(ctx, {
      model: "member",
      where: [
        { field: "organizationId", value: activeOrganizationId },
        { field: "userId", value: authUser._id },
      ],
    });

    if (!membership) {
      return null;
    }

    const organization = await findOne<BetterAuthOrganization>(ctx, {
      model: "organization",
      where: [{ field: "_id", value: activeOrganizationId }],
    });

    if (!organization) {
      return null;
    }

    const invitations = await findMany<BetterAuthInvitation>(ctx, {
      model: "invitation",
      where: [{ field: "organizationId", value: activeOrganizationId }],
    });

    return {
      id: organization._id,
      name: organization.name,
      slug: organization.slug ?? null,
      churchTimeZone: organization.churchTimeZone ?? null,
      completedOnboarding: organization.completedOnboarding ?? false,
      url: organization.url ?? null,
      street: organization.street ?? null,
      city: organization.city ?? null,
      state: organization.state ?? null,
      zip: organization.zip ?? null,
      countryCode: organization.countryCode ?? null,
      latitude: organization.latitude ?? null,
      longitude: organization.longitude ?? null,
      size: organization.size ?? null,
      role: membership.role,
      currentUserId: membership.userId,
      invitations: invitations.map((invitation) => ({
        id: invitation._id,
        email: invitation.email,
        role: invitation.role ?? "member",
        status: invitation.status,
      })),
    };
  },
});

export const listMembers = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const authUser = await getAuthUser(ctx);

    if (!authUser) {
      return [];
    }

    const currentMembership = await findOne<BetterAuthMember>(ctx, {
      model: "member",
      where: [
        { field: "organizationId", value: args.organizationId },
        { field: "userId", value: authUser._id },
      ],
    });

    if (!currentMembership) {
      return [];
    }

    const members = await findMany<BetterAuthMember>(ctx, {
      model: "member",
      where: [{ field: "organizationId", value: args.organizationId }],
    });

    // The Church's active (non-archived) Teams, so we can list each member's
    // Team names without leaking memberships from archived Teams.
    const teams = await findMany<BetterAuthTeamRow>(ctx, {
      model: "team",
      where: [{ field: "organizationId", value: args.organizationId }],
    });
    const activeTeamIds = new Set(
      teams.filter((team) => (team.archivedAt ?? null) === null).map((team) => team._id),
    );
    const teamMemberships =
      teams.length > 0
        ? await findMany<BetterAuthTeamMemberRow>(ctx, {
            model: "teamMember",
            where: [{ field: "teamId", operator: "in", value: teams.map((team) => team._id) }],
          })
        : [];
    const teamIdsByUserId = new Map<string, Array<string>>();
    for (const membership of teamMemberships) {
      if (!activeTeamIds.has(membership.teamId)) continue;
      const list = teamIdsByUserId.get(membership.userId) ?? [];
      list.push(membership.teamId);
      teamIdsByUserId.set(membership.userId, list);
    }

    return await Promise.all(
      members.map(async (member) => {
        const user = await findOne<BetterAuthUser>(ctx, {
          model: "user",
          where: [{ field: "_id", value: member.userId }],
        });

        // "Last seen" is approximated by the most recent session activity for
        // the user; Better Auth refreshes session.updatedAt as the user is
        // active. Absent any session row, we surface null.
        const sessions = await findMany<BetterAuthSessionRow>(ctx, {
          model: "session",
          where: [{ field: "userId", value: member.userId }],
        });
        const lastSeenAt = sessions.reduce<number | null>((latest, session) => {
          const seen = session.updatedAt ?? session.createdAt ?? null;
          if (seen === null) return latest;
          return latest === null || seen > latest ? seen : latest;
        }, null);

        return {
          id: member._id,
          role: member.role,
          joinedAt: member.createdAt ?? null,
          teamIds: teamIdsByUserId.get(member.userId) ?? [],
          user: {
            id: member.userId,
            name: user?.name ?? null,
            email: user?.email ?? null,
            image: user?.image ?? null,
            username: user?.displayUsername ?? user?.username ?? null,
            suspended: user?.banned === true,
            createdAt: user?.createdAt ?? null,
            lastSeenAt,
          },
        };
      }),
    );
  },
});

export const updateMemberName = mutation({
  args: { organizationId: v.string(), memberId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await assertOrgAdmin(ctx, args.organizationId);
    const { user } = await getChurchMember(ctx, args);

    const name = args.name.trim();
    if (name === "") {
      throw new Error("Name is required.");
    }

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { name },
      },
    });

    return { ok: true as const };
  },
});

export const updateMemberUsername = mutation({
  args: { organizationId: v.string(), memberId: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    await assertOrgAdmin(ctx, args.organizationId);
    const { user } = await getChurchMember(ctx, args);

    const displayUsername = args.username.trim();
    if (displayUsername === "") {
      throw new Error("Username is required.");
    }

    // Better Auth stores a normalized `username` (lowercase) alongside the
    // display form; keep both in sync so lookups and rendering agree.
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { username: displayUsername.toLowerCase(), displayUsername },
      },
    });

    return { ok: true as const };
  },
});

export const updateMemberEmail = mutation({
  args: { organizationId: v.string(), memberId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    await assertOrgAdmin(ctx, args.organizationId);
    const { user } = await getChurchMember(ctx, args);

    const email = args.email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error("Email must be valid.");
    }

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { email },
      },
    });

    return { ok: true as const };
  },
});

export const setMemberSuspended = mutation({
  args: { organizationId: v.string(), memberId: v.string(), suspended: v.boolean() },
  handler: async (ctx, args) => {
    const { authUser } = await assertOrgAdmin(ctx, args.organizationId);
    const { user } = await getChurchMember(ctx, args);

    if (user._id === authUser._id) {
      throw new Error("You cannot suspend yourself.");
    }

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: user._id }],
        update: { banned: args.suspended },
      },
    });

    return { ok: true as const };
  },
});
