import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";

/**
 * The active Church id, read from the ambient session/org context (the
 * church-work analog of preach-x's `useOrgId`). Returns `null` when no Church
 * is active so callers can gate Zero queries on it. Components deep in the tree
 * (e.g. the self-contained Task field tooltips) use this instead of threading
 * `churchId` through props.
 */
export function useChurchId(): string | null {
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();

  return activeChurch?.id ?? null;
}

/**
 * The signed-in user's id, read from the ambient session/org context (the
 * church-work analog of preach-x's `useUserId`). Returns `null` when there is no
 * active session.
 */
export function useCurrentUserId(): string | null {
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();

  return activeChurch?.currentUserId ?? null;
}
