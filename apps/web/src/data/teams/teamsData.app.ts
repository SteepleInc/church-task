import { mutators, queries, type Team, type TeamMembership } from "@church-task/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

export type TeamCollectionItem = {
  readonly id: string;
  readonly name: string;
  readonly identifier: string;
  readonly previousIdentifiers: readonly string[];
  readonly color: string;
  readonly sortOrder: number;
};

export type TeamMembershipCollectionItem = {
  readonly id: string;
  readonly teamId: string;
  readonly userId: string;
};

type MutationResult = Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: { readonly message: string } }
>;
type ZeroMutationResult = {
  readonly client: Promise<
    | { readonly type: "success" }
    | { readonly type: "error"; readonly error: { readonly message: string } }
  >;
  readonly server: Promise<
    | { readonly type: "success" }
    | { readonly type: "error"; readonly error: { readonly message: string } }
  >;
};

const parsePreviousIdentifiers = (value: string): readonly string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const mapTeam = (team: Team): TeamCollectionItem => ({
  color: team.color,
  id: team.id,
  identifier: team.identifier,
  name: team.name,
  previousIdentifiers: parsePreviousIdentifiers(team.previous_identifiers ?? "[]"),
  sortOrder: team.sort_order,
});

const mapTeamMembership = (membership: TeamMembership): TeamMembershipCollectionItem => ({
  id: membership.id,
  teamId: membership.team_id,
  userId: membership.user_id,
});

const mutationResult = async (run: () => ZeroMutationResult): MutationResult => {
  try {
    const result = await run().client;

    if (result.type === "error") {
      return { error: { message: result.error.message }, ok: false };
    }

    return { ok: true };
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : "Could not update Teams." },
      ok: false,
    };
  }
};

const testTeamMutation = async (body: {
  readonly action: "create" | "delete" | "rename" | "set_identifier";
  readonly churchId: string;
  readonly identifier?: string;
  readonly name?: string;
  readonly teamId?: string;
}): MutationResult => {
  if (import.meta.env.MODE !== "e2e") return { ok: false, error: { message: "Not available." } };

  const response = await fetch("/api/test/team-mutation", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: { message: result?.error ?? "Could not update Teams." }, ok: false };
  }

  return { ok: true };
};

export function useTeamsCollection(params: { readonly churchId: string | null }) {
  const [rows] = useQuery(
    queries.teams.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const [serverRows, setServerRows] = useState<readonly TeamCollectionItem[]>([]);
  const collection = params.churchId === null ? [] : rows.map(mapTeam);
  const visibleTeams =
    import.meta.env.MODE === "e2e" && serverRows.length > 0
      ? serverRows
      : collection.length > 0
        ? collection
        : serverRows;

  useEffect(() => {
    if (params.churchId === null || (import.meta.env.MODE !== "e2e" && collection.length > 0)) {
      setServerRows([]);
      return;
    }

    const controller = new AbortController();
    const churchId = params.churchId;

    const fetchTeams = () => {
      void fetch(`/api/onboarding/teams?churchId=${encodeURIComponent(churchId)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;

          const body = (await response.json()) as {
            readonly teams?: readonly TeamCollectionItem[];
          };
          setServerRows(body.teams ?? []);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 1_000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [params.churchId, collection.length]);

  return {
    collection: visibleTeams,
    loading: false,
    teamsCollection: visibleTeams,
  };
}

export function useTeamMembershipsCollection(params: { readonly churchId: string | null }) {
  const [rows] = useQuery(
    queries.team_memberships.by_church({ church_id: params.churchId ?? "__no_church__" }),
  );
  const collection = params.churchId === null ? [] : rows.map(mapTeamMembership);

  return {
    collection,
    loading: false,
    teamMembershipsCollection: collection,
  };
}

export function useCreateTeamMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly name: string }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTeamMutation({ action: "create", churchId: params.churchId, name: params.name });
    }

    return mutationResult(() =>
      zero.mutate(mutators.teams.create({ church_id: params.churchId, name: params.name })),
    );
  };
}

export function useRenameTeamMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly name: string;
    readonly teamId: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTeamMutation({
        action: "rename",
        churchId: params.churchId,
        name: params.name,
        teamId: params.teamId,
      });
    }

    return mutationResult(() =>
      zero.mutate(
        mutators.teams.rename({
          church_id: params.churchId,
          name: params.name,
          team_id: params.teamId,
        }),
      ),
    );
  };
}

export function useSetTeamIdentifierMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly identifier: string;
    readonly teamId: string;
  }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTeamMutation({
        action: "set_identifier",
        churchId: params.churchId,
        identifier: params.identifier,
        teamId: params.teamId,
      });
    }

    return mutationResult(() =>
      zero.mutate(
        mutators.teams.set_identifier({
          church_id: params.churchId,
          identifier: params.identifier,
          team_id: params.teamId,
        }),
      ),
    );
  };
}

export function useArchiveTeamMutation() {
  return useDeleteTeamMutation();
}

export function useDeleteTeamMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly teamId: string }) => {
    if (import.meta.env.MODE === "e2e") {
      return testTeamMutation({
        action: "delete",
        churchId: params.churchId,
        teamId: params.teamId,
      });
    }

    return mutationResult(() =>
      zero.mutate(mutators.teams.delete({ church_id: params.churchId, team_id: params.teamId })),
    );
  };
}

export function useReorderTeamsMutation() {
  const zero = useZero();

  return (params: { readonly churchId: string; readonly teamIds: readonly string[] }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.teams.reorder({ church_id: params.churchId, team_ids: [...params.teamIds] }),
      ),
    );
}

export function useAddTeamMemberMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly teamId: string;
    readonly userId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.teams.add_member({
          church_id: params.churchId,
          team_id: params.teamId,
          user_id: params.userId,
        }),
      ),
    );
}

export function useRemoveTeamMemberMutation() {
  const zero = useZero();

  return (params: {
    readonly churchId: string;
    readonly teamId: string;
    readonly userId: string;
  }) =>
    mutationResult(() =>
      zero.mutate(
        mutators.teams.remove_member({
          church_id: params.churchId,
          team_id: params.teamId,
          user_id: params.userId,
        }),
      ),
    );
}
