import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

export const completeOnboarding = () =>
  ({
    endpoints: {
      completeOnboarding: createAuthEndpoint(
        "/complete-onboarding",
        {
          body: z.object({ orgId: z.string() }),
          method: "POST",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const session = ctx.context.session;
          const { orgId } = ctx.body;

          if (session.session.activeOrganizationId !== orgId) {
            throw ctx.error("BAD_REQUEST", { message: "Church ID does not match active Church" });
          }

          await ctx.context.adapter.update({
            model: "organization",
            update: { completedOnboarding: true },
            where: [{ field: "id", value: orgId }],
          });

          const updatedSession = await ctx.context.internalAdapter.updateSession(
            session.session.token,
            {
              activeOrganizationId: orgId,
              orgCompletedOnboarding: true,
            },
          );

          if (!updatedSession) {
            throw ctx.error("INTERNAL_SERVER_ERROR", { message: "Failed to update session" });
          }

          await setSessionCookie(ctx, { session: updatedSession, user: session.user });

          return ctx.json({ status: true });
        },
      ),
    },
    id: "complete-onboarding",
  }) satisfies BetterAuthPlugin;

export const clearOrgForOnboarding = () =>
  ({
    endpoints: {
      clearOrgForOnboarding: createAuthEndpoint(
        "/clear-org-for-onboarding",
        {
          method: "POST",
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const session = ctx.context.session;
          const updatedSession = await ctx.context.internalAdapter.updateSession(
            session.session.token,
            {
              activeOrganizationId: null,
              orgCompletedOnboarding: null,
              orgRole: null,
              orgType: null,
              skipOrgFallback: true,
            },
          );

          if (!updatedSession) {
            throw ctx.error("INTERNAL_SERVER_ERROR", { message: "Failed to update session" });
          }

          await setSessionCookie(ctx, { session: updatedSession, user: session.user });

          return ctx.json({ status: true });
        },
      ),
    },
    id: "clear-org-for-onboarding",
  }) satisfies BetterAuthPlugin;
