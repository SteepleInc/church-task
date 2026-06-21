/**
 * Client-side mirror of the server's `canModerateTaskComment` check (see
 * `packages/zero/src/mutators.ts`). A Task Comment can be edited or deleted by
 * its author, by Church owners/admins, or by app administrators. Keeping the
 * affordance gate aligned with the mutator means moderators see Edit/Delete
 * instead of silently hitting a server rejection.
 */
export type TaskCommentModerationViewer = {
  /** The signed-in user's id, or null when signed out. */
  readonly currentUserId: string | null;
  /** The viewer's role in the active Church (e.g. "owner", "admin", "member"). */
  readonly churchRole: string | null;
  /** Whether the viewer is an app administrator. */
  readonly isAppAdmin: boolean;
};

export function isChurchModerator(viewer: TaskCommentModerationViewer): boolean {
  return viewer.isAppAdmin || viewer.churchRole === "owner" || viewer.churchRole === "admin";
}

export function canModerateTaskComment(params: {
  readonly viewer: TaskCommentModerationViewer;
  readonly authoredByUserId: string;
}): boolean {
  const { viewer, authoredByUserId } = params;
  if (viewer.currentUserId !== null && viewer.currentUserId === authoredByUserId) return true;
  return isChurchModerator(viewer);
}
