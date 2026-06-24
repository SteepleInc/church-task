import { UserRound, Users } from "lucide-react";
import type { ReactElement } from "react";

import { UserAvatar } from "@/components/avatars/userAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The Member identity the assignee hover card renders. Mirrors Linear's profile
 * popover with the fields we actually have: avatar, name, an email/username
 * subtitle, the org Role, and the Member's Teams. Presence + local time are
 * intentionally omitted (we don't track them).
 */
export type AssigneeProfile = {
  readonly userId: string;
  readonly name: string;
  readonly subtitle: string | null;
  readonly image: string | null;
  readonly role: string | null;
  readonly teamNames: readonly string[];
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const formatRole = (role: string): string =>
  ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);

// Linear shows the first couple of Teams inline and rolls the rest into a
// "+N" overflow so the card stays compact for Members on many Teams.
const TEAM_NAMES_VISIBLE = 2;

const formatTeamNames = (names: readonly string[]): string => {
  if (names.length <= TEAM_NAMES_VISIBLE) return names.join(", ");
  const visible = names.slice(0, TEAM_NAMES_VISIBLE).join(", ");
  return `${visible} +${names.length - TEAM_NAMES_VISIBLE}`;
};

type AssigneeHoverCardProps = {
  // The resolved profile, or null when the Task is unassigned.
  readonly profile: AssigneeProfile | null;
  readonly children: ReactElement;
  // Suppressed on the drag overlay, where hover surfaces would be noise.
  readonly disabled?: boolean;
};

/**
 * Linear-style rich profile tooltip for a Task's assignee avatar: the Member's
 * avatar + name (+ email/username), their Role, and the Teams they belong to.
 * Hover-only — clicks pass through to the assignee picker. The unassigned
 * avatar shows a minimal "No assignee" card. Built on the shared Tooltip
 * primitive so it shares one timer/animation with every other field tooltip.
 */
export function AssigneeHoverCard({ profile, children, disabled }: AssigneeHoverCardProps) {
  if (disabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent
        align="start"
        className="block w-64 items-stretch gap-0 p-2.5 text-sm font-normal"
        side="bottom"
      >
        {profile === null ? (
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="size-5" strokeWidth={1.5} />
            </span>
            <span className="font-medium text-sm">No assignee</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatar={profile.image}
                name={profile.name}
                size={40}
                userId={profile.userId}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-sm leading-tight">{profile.name}</span>
                {profile.subtitle ? (
                  <span className="truncate text-muted-foreground text-xs leading-tight">
                    {profile.subtitle}
                  </span>
                ) : null}
              </div>
            </div>
            {profile.role || profile.teamNames.length > 0 ? (
              <div className="flex flex-col gap-2 text-xs">
                {profile.role ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserRound className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{formatRole(profile.role)}</span>
                  </div>
                ) : null}
                {profile.teamNames.length > 0 ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{formatTeamNames(profile.teamNames)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
