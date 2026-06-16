import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { useSetAtom } from "jotai";
import {
  AtSignIcon,
  Check,
  ChevronDown,
  MailIcon,
  MoreHorizontal,
  Search,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { BaseAvatar } from "@/components/avatars/baseAvatar";
import { SettingsColumnHeader, SettingsTable } from "@/components/collections/settingsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { type MemberItem, useMembersCollection } from "@/data/members/membersData.app";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { useTeamsCollection, type TeamCollectionItem } from "@/data/teams/teamsData.app";
import { InviteMemberButton, InviteMemberQuickAction } from "@/features/settings/invite-member";
import { canInviteChurchMembers } from "@/features/settings/invite-member-utils";
import {
  MemberQuickActions,
  type MemberQuickActionMode,
  memberQuickActionStateAtom,
} from "@/features/quick-actions/member-quick-actions";

type MemberStatusFilter = "all" | "members" | "pending-invites" | "suspended";

const STATUS_FILTER_OPTIONS: readonly {
  readonly value: MemberStatusFilter;
  readonly label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "members", label: "Members" },
  { value: "pending-invites", label: "Pending invites" },
  { value: "suspended", label: "Suspended" },
];

type PendingInvite = {
  readonly id: string;
  readonly email: string;
  readonly role: string;
};

const roleLabel = (role: string): string =>
  role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member";

const formatRelative = (timestamp: number | null): string => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDistanceToNow(date)} ago`;
};

const matchesFilter = (member: MemberItem, value: string): boolean => {
  if (!value) return true;
  const needle = value.toLowerCase();
  return (
    (member.name ?? "").toLowerCase().includes(needle) ||
    (member.email ?? "").toLowerCase().includes(needle) ||
    (member.username ?? "").toLowerCase().includes(needle)
  );
};

export function SettingsMembersPanel() {
  const { currentOrgOpt: activeChurch, loading } = useCurrentOrgOpt();
  const churchId = activeChurch?.id ?? null;
  const members = useMembersCollection({ churchId });
  const teams = useTeamsCollection({ churchId });

  const pendingInvites: readonly PendingInvite[] = (activeChurch?.invitations ?? [])
    .filter((invitation) => invitation.status === "pending")
    .map((invitation) => ({ id: invitation.id, email: invitation.email, role: invitation.role }));

  const canManage = canInviteChurchMembers(activeChurch?.role);

  return (
    <MembersPanelView
      canManage={canManage}
      churchId={churchId}
      churchRole={activeChurch?.role ?? null}
      currentUserId={activeChurch?.currentUserId ?? null}
      hasChurch={Boolean(activeChurch) || loading}
      loading={loading || members.loading}
      members={members.membersCollection}
      pendingInvites={pendingInvites}
      teams={teams.teamsCollection}
    />
  );
}

/**
 * Linear-style workspace Members settings: a single framed pane with a title, a
 * search + status-filter + Invite toolbar, and dense tables grouped by Active /
 * Suspended / Pending invites. Each member row exposes a "..." menu of update
 * actions (name, username, email, suspend, manage teams) that are limited to
 * org admins.
 */
function MembersPanelView({
  canManage,
  churchId,
  churchRole,
  currentUserId,
  hasChurch,
  loading,
  members,
  pendingInvites,
  teams,
}: {
  readonly canManage: boolean;
  readonly churchId: string | null;
  readonly churchRole: string | null;
  readonly currentUserId: string | null;
  readonly hasChurch: boolean;
  readonly loading: boolean;
  readonly members: readonly MemberItem[];
  readonly pendingInvites: readonly PendingInvite[];
  readonly teams: readonly TeamCollectionItem[];
}) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all");
  const openMemberAction = useSetAtom(memberQuickActionStateAtom);
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team] as const)), [teams]);

  const filteredMembers = members.filter((member) => matchesFilter(member, filter));
  const activeMembers = filteredMembers.filter((member) => !member.suspended);
  const suspendedMembers = filteredMembers.filter((member) => member.suspended);
  const filteredInvites = pendingInvites.filter(
    (invite) => !filter || invite.email.toLowerCase().includes(filter.toLowerCase()),
  );

  const columns = useMemo<Array<ColumnDef<MemberItem>>>(
    () => [
      {
        accessorFn: (member) => member.name ?? member.email ?? "",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <BaseAvatar
                avatar={member.image}
                name={member.name ?? member.email ?? null}
                size={28}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-sm">
                  {member.name ?? member.email ?? "Unnamed member"}
                </span>
                {member.username ? (
                  <span className="truncate text-muted-foreground text-xs">{member.username}</span>
                ) : null}
              </div>
            </div>
          );
        },
        header: ({ column }) => <SettingsColumnHeader column={column}>Name</SettingsColumnHeader>,
        id: "name",
        meta: { className: "min-w-56" },
      },
      {
        accessorFn: (member) => member.email ?? "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.email ?? "—"}
          </span>
        ),
        header: ({ column }) => <SettingsColumnHeader column={column}>Email</SettingsColumnHeader>,
        id: "email",
        meta: { className: "min-w-48" },
      },
      {
        accessorFn: (member) => member.role,
        cell: ({ row }) =>
          row.original.suspended ? (
            <Badge variant="destructive">Suspended</Badge>
          ) : (
            <Badge variant="secondary">{roleLabel(row.original.role)}</Badge>
          ),
        header: ({ column }) => <SettingsColumnHeader column={column}>Status</SettingsColumnHeader>,
        id: "status",
        meta: { className: "w-28" },
      },
      {
        accessorFn: (member) => member.teamIds.length,
        cell: ({ row }) => {
          const names = row.original.teamIds
            .map((teamId) => teamsById.get(teamId)?.name)
            .filter((name): name is string => Boolean(name));
          if (names.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="whitespace-nowrap text-muted-foreground" title={names.join(", ")}>
              {names.length === 1 ? names[0] : `${names.length} teams`}
            </span>
          );
        },
        header: ({ column }) => <SettingsColumnHeader column={column}>Teams</SettingsColumnHeader>,
        id: "teams",
        meta: { className: "w-28" },
      },
      {
        accessorFn: (member) => member.joinedAt ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRelative(row.original.joinedAt)}
          </span>
        ),
        header: ({ column }) => <SettingsColumnHeader column={column}>Joined</SettingsColumnHeader>,
        id: "joinedAt",
        meta: { className: "w-32" },
      },
      {
        accessorFn: (member) => member.lastSeenAt ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRelative(row.original.lastSeenAt)}
          </span>
        ),
        header: ({ column }) => (
          <SettingsColumnHeader column={column}>Last seen</SettingsColumnHeader>
        ),
        id: "lastSeenAt",
        meta: { className: "w-32" },
      },
    ],
    [teamsById],
  );

  const renderTable = (rows: readonly MemberItem[]) => (
    <SettingsTable<MemberItem>
      columnsDef={columns}
      data={rows}
      getRowId={(member) => member.memberId}
      initialSorting={[{ desc: false, id: "name" }]}
      loading={loading}
      rowActions={
        canManage && churchId
          ? (member) => (
              <MemberRowActions
                canSuspend={member.userId !== currentUserId}
                onSelect={(mode) => openMemberAction({ mode, churchId, member })}
                suspended={member.suspended}
              />
            )
          : undefined
      }
    />
  );

  const showActive = statusFilter === "all" || statusFilter === "members";
  const showSuspended = statusFilter === "all" || statusFilter === "suspended";
  const showInvites = statusFilter === "all" || statusFilter === "pending-invites";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-semibold text-2xl tracking-tight">Members</h1>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(event) => setFilter(event.currentTarget.value)}
              placeholder="Search by name or email"
              value={filter}
            />
          </div>
          <StatusFilterMenu onChange={setStatusFilter} value={statusFilter} />
        </div>
        {churchId ? <InviteMemberButton disabled={!canManage} variant="default" /> : null}
      </div>

      {!hasChurch ? (
        <p className="text-muted-foreground text-sm">No active Church selected.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {showActive ? (
            <MemberGroup count={activeMembers.length} title="Active">
              {renderTable(activeMembers)}
            </MemberGroup>
          ) : null}

          {showSuspended && suspendedMembers.length > 0 ? (
            <MemberGroup count={suspendedMembers.length} title="Suspended">
              {renderTable(suspendedMembers)}
            </MemberGroup>
          ) : null}

          {showInvites && filteredInvites.length > 0 ? (
            <MemberGroup count={filteredInvites.length} title="Pending invites">
              <PendingInvitesTable invites={filteredInvites} />
            </MemberGroup>
          ) : null}
        </div>
      )}

      {churchId && churchRole !== null ? (
        <InviteMemberQuickAction
          activeChurchId={churchId}
          activeChurchRole={churchRole}
          source="settings"
        />
      ) : null}
      <MemberQuickActions />
    </div>
  );
}

function MemberGroup({
  title,
  count,
  children,
}: {
  readonly title: string;
  readonly count: number;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3">
        <h2 className="font-medium text-muted-foreground text-sm">{title}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
      </div>
      {children}
    </section>
  );
}

function StatusFilterMenu({
  value,
  onChange,
}: {
  readonly value: MemberStatusFilter;
  readonly onChange: (value: MemberStatusFilter) => void;
}) {
  const current = STATUS_FILTER_OPTIONS.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="gap-1.5" type="button" variant="outline">
            {current?.label ?? "All"}
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-44">
        {STATUS_FILTER_OPTIONS.map((option) => (
          <DropdownMenuItem
            className="justify-between"
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.value === value ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitesTable({ invites }: { readonly invites: readonly PendingInvite[] }) {
  return (
    <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
      <tbody>
        {invites.map((invite) => (
          <tr className="group/row" key={invite.id}>
            <td className="h-11 rounded-l-lg px-3 align-middle transition-colors group-hover/row:bg-muted/50">
              <span className="text-sm">{invite.email}</span>
            </td>
            <td className="h-11 rounded-r-lg px-3 text-right align-middle transition-colors group-hover/row:bg-muted/50">
              <Badge variant="outline">{roleLabel(invite.role)}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The trailing per-row "..." actions menu for a member. Mirrors Linear's member
 * row menu: Update name / username / email, Suspend (or Reactivate), Manage
 * teams. Each item opens the matching quick-action dialog.
 */
function MemberRowActions({
  canSuspend,
  onSelect,
  suspended,
}: {
  readonly canSuspend: boolean;
  readonly onSelect: (mode: MemberQuickActionMode) => void;
  readonly suspended: boolean;
}): ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Open member actions"
            className="opacity-0 group-hover/row:opacity-100 aria-expanded:opacity-100"
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48" side="bottom">
        <DropdownMenuItem onClick={() => onSelect("update-name")}>
          <UserRoundIcon />
          Update name...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("update-username")}>
          <AtSignIcon />
          Update username...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("update-email")}>
          <MailIcon />
          Update email...
        </DropdownMenuItem>
        {canSuspend ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onSelect("suspend")}
              variant={suspended ? "default" : "destructive"}
            >
              <UserRoundIcon />
              {suspended ? "Reactivate user..." : "Suspend user..."}
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSelect("manage-teams")}>
          <UsersRoundIcon />
          Manage teams...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
