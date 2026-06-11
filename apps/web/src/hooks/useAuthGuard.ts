import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { COMPLETED_APP_LANDING_PATH } from "@/data/org-routing";
import type { SessionOrgRoutingFields } from "@/data/org-routing";
import { useCurrentOrgOpt, type CurrentOrg } from "@/data/orgs/orgData.app";
import { authClient } from "@/lib/auth-client";

type UseAuthGuardOptions = {
  /** Redirect to /onboarding when the Active Church is missing or has not Completed Onboarding. */
  readonly requireOnboarding?: boolean;
  /** Redirect into the product when the Active Church has Completed Onboarding. */
  readonly redirectIfOnboarded?: boolean;
};

type UseAuthGuardResult = {
  readonly loading: boolean;
  readonly activeChurch: CurrentOrg | null;
  readonly hasCompletedOnboarding: boolean;
};

/**
 * Routing guard over the live Active Church query. Gating reads the reactive
 * Convex query directly (no session mirror); see
 * docs/adr/0008-persist-early-onboarding-with-derived-steps.md.
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const { requireOnboarding = false, redirectIfOnboarded = false } = options;
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { currentOrgOpt: activeChurch, loading } = useCurrentOrgOpt();
  const sessionRouting = session?.session as SessionOrgRoutingFields | undefined;
  const hasCompletedOnboarding = Boolean(
    sessionRouting?.orgCompletedOnboarding ?? activeChurch?.completedOnboarding,
  );

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (requireOnboarding && !hasCompletedOnboarding) {
      void navigate({ to: "/onboarding" });
      return;
    }

    if (redirectIfOnboarded && hasCompletedOnboarding) {
      void navigate({ to: COMPLETED_APP_LANDING_PATH });
    }
  }, [hasCompletedOnboarding, navigate, redirectIfOnboarded, requireOnboarding, sessionLoading]);

  return { loading: sessionLoading || loading, activeChurch, hasCompletedOnboarding };
}
