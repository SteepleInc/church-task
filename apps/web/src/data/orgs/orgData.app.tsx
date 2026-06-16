import { nullOp } from "@church-task/shared/noOps";
import { api } from "@church-task/backend-old/convex/_generated/api";
import { useMutation } from "convex/react";
import type { ReactNode } from "react";

import { recordFromCollection } from "@/data/convex-query-adapter";
import { recordOptimisticUpdate } from "@/data/optimistic-collection";
import { useUserOrgsCollection, type OrgCollectionItem } from "@/data/orgs/orgsData.app";
import { authClient } from "@/lib/auth-client";

export type CurrentOrg = {
  readonly id: string;
  readonly name: string;
  readonly slug: string | null;
  readonly churchTimeZone: string | null;
  readonly completedOnboarding: boolean;
  readonly url: string | null;
  readonly street: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly zip: string | null;
  readonly countryCode: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly size: string | null;
  readonly role: string;
  readonly currentUserId: string;
  readonly invitations: readonly {
    readonly id: string;
    readonly email: string;
    readonly role: string;
    readonly status: string;
  }[];
};

export function useOrgData(params: { readonly orgId: string }) {
  const orgs = useUserOrgsCollection();
  const state = recordFromCollection(orgs, (org) => org.id === params.orgId);

  return {
    loading: state.loading,
    orgOpt: state.record,
  };
}

export function useCurrentOrgOpt() {
  const { data: activeOrg, isPending } = authClient.useActiveOrganization();
  const session = authClient.useSession();
  const activeMember = activeOrg?.members?.find(
    (member) => member.userId === session.data?.user?.id,
  );
  const currentOrgOpt: CurrentOrg | null = activeOrg
    ? {
        id: activeOrg.id,
        name: activeOrg.name,
        slug: activeOrg.slug ?? null,
        churchTimeZone: activeOrg.churchTimeZone ?? null,
        completedOnboarding: Boolean(activeOrg.completedOnboarding),
        url: activeOrg.url ?? null,
        street: activeOrg.street ?? null,
        city: activeOrg.city ?? null,
        state: activeOrg.state ?? null,
        zip: activeOrg.zip ?? null,
        countryCode: activeOrg.countryCode ?? null,
        latitude: activeOrg.latitude ?? null,
        longitude: activeOrg.longitude ?? null,
        size: activeOrg.size ?? null,
        role: activeMember?.role ?? "member",
        currentUserId: session.data?.user?.id ?? "",
        invitations:
          activeOrg.invitations?.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
          })) ?? [],
      }
    : null;

  return {
    loading: isPending || session.isPending,
    currentOrgOpt,
  };
}

export function useUpdateChurchTimeZoneMutation() {
  return useMutation(api.churchSettings.updateTimeZone).withOptimisticUpdate(
    recordOptimisticUpdate({
      query: api.dashboard.getActiveOrganization,
      patch: (
        org: CurrentOrg,
        args: { readonly churchId: string; readonly churchTimeZone: string },
      ) => (org.id === args.churchId ? { ...org, churchTimeZone: args.churchTimeZone } : org),
    }),
  );
}

export function CurrentOrgWrapper(props: { readonly children: (org: CurrentOrg) => ReactNode }) {
  const { currentOrgOpt } = useCurrentOrgOpt();

  return currentOrgOpt ? props.children(currentOrgOpt) : nullOp();
}

export function OrgWrapper(props: {
  readonly orgId: string;
  readonly children: (org: OrgCollectionItem) => ReactNode;
}) {
  const { orgOpt } = useOrgData({ orgId: props.orgId });

  return orgOpt ? props.children(orgOpt) : nullOp();
}
