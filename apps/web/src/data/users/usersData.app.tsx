import { api } from "@church-task/backend/convex/_generated/api";
import type { User } from "@church-task/domain";
import { useQuery } from "convex/react";

import { collectionFromQueryResult } from "@/data/convex-query-adapter";

export type UserCollectionItem = Pick<User, "id" | "name"> & {
  readonly email: User["email"] | null;
  readonly memberId: string;
  readonly role: string;
};

export function useChurchUsersCollection(params: { readonly churchId: string | null }) {
  const result = useQuery(
    api.dashboard.listMembers,
    params.churchId ? { organizationId: params.churchId } : "skip",
  );
  const state = collectionFromQueryResult(
    result?.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      memberId: member.id,
      role: member.role,
    })) satisfies readonly UserCollectionItem[] | undefined,
  );

  return {
    loading: params.churchId !== null && state.loading,
    collection: state.collection,
    usersCollection: state.collection,
  };
}
