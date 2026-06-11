import { atom, useSetAtom } from "jotai";
import {
  Building2Icon,
  ClipboardPlusIcon,
  SettingsIcon,
  UserPlusIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useMemo } from "react";

import { inviteMemberDialogSourceAtom } from "@/features/settings/invite-member";
import type { QuickActionDefinition } from "@/features/quick-actions/quick-actions-types";
import { createTaskQuickActionStateAtom } from "@/features/quick-actions/create-task-quick-action";
import { teamQuickActionStateAtom } from "@/features/quick-actions/team-quick-action";

export const disableQuickActionsAtom = atom(false);
export const quickActionsIsOpenAtom = atom(false);

type BuildChurchTaskQuickActionsInput = {
  readonly canInviteMembers: boolean;
  readonly canManageTeams: boolean;
  readonly closeQuickActions: () => void;
  readonly openCreateTask: () => void;
  readonly openCreateTeam: () => void;
  readonly navigateToSettings: () => void;
  readonly openInviteMember: () => void;
};

export function buildChurchTaskQuickActions({
  canInviteMembers,
  canManageTeams,
  closeQuickActions,
  openCreateTask,
  openCreateTeam,
  navigateToSettings,
  openInviteMember,
}: BuildChurchTaskQuickActionsInput): QuickActionDefinition[] {
  const selectAndClose = (action: () => void | Promise<void>) => async () => {
    await action();
    closeQuickActions();
  };

  return [
    {
      group: "quick-action",
      icon: ClipboardPlusIcon,
      name: "Create Task",
      description: "Open the task creation dialog.",
      keywords: ["task", "create", "todo", "my work", "church"],
      enabled: true,
      onSelect: selectAndClose(openCreateTask),
    },
    {
      group: "quick-action",
      icon: UsersRoundIcon,
      name: "Create Team",
      description: "Create a Team in this Church.",
      keywords: ["team", "create", "group", "church"],
      enabled: canManageTeams,
      disabledReason: canManageTeams
        ? undefined
        : "Only Church owners and admins can create Teams.",
      onSelect: selectAndClose(openCreateTeam),
    },
    {
      group: "quick-action",
      icon: UserPlusIcon,
      name: "Invite Member",
      description: "Invite someone to this Church.",
      keywords: ["invite", "member", "church", "email"],
      enabled: canInviteMembers,
      disabledReason: canInviteMembers
        ? undefined
        : "Only Church owners and admins can invite members.",
      onSelect: selectAndClose(openInviteMember),
    },
    {
      group: "quick-action",
      icon: UsersIcon,
      name: "Team Settings",
      description: "Manage Church members, Teams, and invitations.",
      keywords: ["team", "members", "invitations", "settings"],
      enabled: true,
      onSelect: selectAndClose(navigateToSettings),
    },
    {
      group: "quick-action",
      icon: Building2Icon,
      name: "Church Settings",
      description: "Review this Church profile and configuration.",
      keywords: ["church", "org", "settings", "profile"],
      enabled: true,
      onSelect: selectAndClose(navigateToSettings),
    },
    {
      group: "quick-action",
      icon: SettingsIcon,
      name: "Profile Settings",
      description: "Update your profile settings.",
      keywords: ["profile", "settings", "user", "account"],
      enabled: true,
      onSelect: selectAndClose(navigateToSettings),
    },
  ];
}

export function useQuickActionOpeners() {
  const setInviteMemberDialogSource = useSetAtom(inviteMemberDialogSourceAtom);
  const setCreateTaskQuickActionState = useSetAtom(createTaskQuickActionStateAtom);
  const setTeamQuickActionState = useSetAtom(teamQuickActionStateAtom);

  return useMemo(
    () => ({
      openCreateTask: (options: { readonly assignTo?: string | null } = {}) =>
        setCreateTaskQuickActionState({
          assignTo: options.assignTo ?? null,
        }),
      openCreateTeam: (options: { readonly churchId: string }) =>
        setTeamQuickActionState({ mode: "create", churchId: options.churchId }),
      openEditTeam: (options: { readonly churchId: string; readonly teamId: string }) =>
        setTeamQuickActionState({
          mode: "edit",
          churchId: options.churchId,
          teamId: options.teamId,
        }),
      openInviteMember: () => setInviteMemberDialogSource("quick-actions"),
    }),
    [setCreateTaskQuickActionState, setInviteMemberDialogSource, setTeamQuickActionState],
  );
}
