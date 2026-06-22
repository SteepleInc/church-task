import { MainContainer, PageContainer, PageWrapper } from "@/components/pageComponents";
import { useAppForm } from "@/components/form/ts-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeTeamIdentifier } from "@church-task/domain";
import { revalidateLogic } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Schema } from "effect";
import { useEffect, useRef, useState } from "react";

import { TaskExecutionSurface } from "@/components/tasks/task-execution-surface";
import {
  resolveExecutionCycleScope,
  selectCurrentExecutionCycle,
} from "@/components/tasks/task-execution-surface-utils";
import { TeamWeeksIndex } from "@/components/weeks/team-weeks-index";
import { buildProjectedWeekCycles } from "@/components/weeks/team-weeks-index-data";
import {
  resolveInsightsState,
  toInsightsSearchValue,
  type ResolvedInsightsState,
} from "@/components/tasks/task-insights-options";
import { useTaskFilterFields } from "@/components/tasks/task-filters";
import { TaskShortcutsHelp } from "@/components/tasks/task-shortcuts-help";
import { TaskViewTopBar } from "@/components/tasks/task-view-top-bar";
import type { ColumnConfig } from "@/components/data-table-filter/core/types";
import { FilterKeys } from "@/shared/global-state";
import { useFilters } from "@/shared/hooks/useFilters";
import {
  getDefaultTaskViewTab,
  resolveTaskViewOptions,
  resolveTaskViewTab,
  toTaskViewSearchValue,
  type ResolvedTaskViewOptions,
  type TaskViewTab,
} from "@/components/tasks/task-view-options";
import { useUserInvitationsCollection } from "@/data/invitations/invitationsData.app";
import { useCyclesCollection } from "@/data/cycles/cyclesData.app";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { useTeamsCollection } from "@/data/teams/teamsData.app";
import { useChurchUsersCollection } from "@/data/users/usersData.app";
import { authClient } from "@/lib/auth-client";
import { InviteMemberButton, InviteMemberQuickAction } from "@/features/settings/invite-member";
import { useQuickActionOpeners } from "@/features/quick-actions/quick-actions-state";
import {
  getWorkSearchForPanel,
  getUnavailableTeamBoardActions,
  resolveTeamByRouteIdentifier,
  type WorkSearch,
} from "@/routes/-work-page-utils";
import type { SessionOrgRoutingFields } from "@/data/org-routing";

export type ActiveWorkPanel =
  | "my_work"
  | "our_work"
  | { kind: "team"; teamIdentifier: string; weekNumber?: number | null }
  | { kind: "team_weeks"; teamIdentifier: string };

function PrivateWorkContent({ activePanel }: { activePanel: ActiveWorkPanel }) {
  const search = useSearch({ strict: false }) as WorkSearch;
  const navigate = useNavigate();
  const { data: sessionData } = authClient.useSession();
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();
  const setActivePanel = (panel: ActiveWorkPanel) => {
    const routeSearch = getWorkSearchForPanel(search);

    if (typeof panel === "object") {
      navigate({
        to: panel.kind === "team_weeks" ? "/team/$teamIdentifier/weeks" : "/team/$teamIdentifier",
        params: { teamIdentifier: panel.teamIdentifier },
        search: routeSearch,
      });
      return;
    }

    navigate({
      to: panel === "my_work" ? "/my-work" : "/our-work",
      search: routeSearch,
    });
  };
  const sessionRouting = sessionData?.session as SessionOrgRoutingFields | undefined;
  const activeChurchId = activeChurch?.id ?? sessionRouting?.activeOrganizationId ?? null;
  const currentUserId = activeChurch?.currentUserId ?? sessionData?.user?.id ?? null;
  const teams = useTeamsCollection({ churchId: activeChurchId });
  const cyclesCollection = useCyclesCollection({ churchId: activeChurchId, currentUserId });
  const pendingInvitations =
    activeChurch?.invitations.filter((invitation) => invitation.status === "pending") ?? [];
  const activeTeams = teams.teamsCollection;
  const selectedTeam =
    typeof activePanel === "object"
      ? resolveTeamByRouteIdentifier(activeTeams, activePanel.teamIdentifier)
      : null;
  const canonicalTeamIdentifier = selectedTeam?.identifier ?? null;
  const unavailableTeamBoardActions = getUnavailableTeamBoardActions();
  const { openCreateTask } = useQuickActionOpeners();
  const showCreateTask = Boolean(activeChurchId) && Boolean(currentUserId);
  const showBoardSurface =
    Boolean(activeChurchId) &&
    Boolean(currentUserId) &&
    !(typeof activePanel === "object" && !selectedTeam);

  const surface = typeof activePanel === "object" ? ("team_board" as const) : activePanel;
  const showTopBar =
    showCreateTask &&
    (typeof activePanel !== "object" || (activePanel.kind === "team" && selectedTeam !== null));
  const activeTab = resolveTaskViewTab(surface, search.tab);
  const activeView = resolveTaskViewOptions(search.view);
  const activeInsights = resolveInsightsState(search.insights);
  const today = new Date().toISOString().slice(0, 10);
  const churchTimeZone = activeChurch?.churchTimeZone ?? "UTC";
  const cycles = buildProjectedWeekCycles({
    churchTimeZone,
    cycles: cyclesCollection.cyclesCollection,
    today,
  });
  const scopedCycle = resolveExecutionCycleScope({
    surface,
    week: search.week,
    weekNumber:
      typeof activePanel === "object" && activePanel.kind === "team"
        ? activePanel.weekNumber
        : null,
    cycles,
    today,
  });
  // On a Team Week board, new Tasks default to the scoped Week's Cycle. The
  // cross-team surfaces (My Work / Our Work) carry no Week scope, so new Tasks
  // default to the current Week, the way Linear files new issues into the
  // active Cycle.
  const topBarTargetCycle =
    surface === "team_board"
      ? scopedCycle?.targetCycle
      : selectCurrentExecutionCycle(cycles, today)?.targetCycle;
  const [taskFilters, setTaskFilters] = useFilters(FilterKeys.Tasks);
  const taskFilterFields = useTaskFilterFields({
    churchId: showTopBar ? activeChurchId : null,
    surface,
    teamId: selectedTeam?.id ?? null,
    tab: activeTab,
  });

  // Imperative opener the keyboard layer triggers for Shift+V; populated by the
  // top bar. (Filter's `F` is handled natively by the reUI Filters menu.)
  const openDisplayOptionsRef = useRef<(() => void) | null>(null);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  useEffect(() => {
    if (typeof activePanel !== "object" || canonicalTeamIdentifier === null) return;

    if (normalizeTeamIdentifier(activePanel.teamIdentifier) !== canonicalTeamIdentifier) {
      let target:
        | {
            readonly to: "/team/$teamIdentifier/weeks";
            readonly params: { readonly teamIdentifier: string };
          }
        | {
            readonly to: "/team/$teamIdentifier/week/$weekNumber";
            readonly params: { readonly teamIdentifier: string; readonly weekNumber: string };
          }
        | {
            readonly to: "/team/$teamIdentifier";
            readonly params: { readonly teamIdentifier: string };
          };

      if (activePanel.kind === "team_weeks") {
        target = {
          to: "/team/$teamIdentifier/weeks",
          params: { teamIdentifier: canonicalTeamIdentifier },
        };
      } else if (activePanel.weekNumber != null) {
        target = {
          to: "/team/$teamIdentifier/week/$weekNumber",
          params: {
            teamIdentifier: canonicalTeamIdentifier,
            weekNumber: String(activePanel.weekNumber),
          },
        };
      } else {
        target = {
          to: "/team/$teamIdentifier",
          params: { teamIdentifier: canonicalTeamIdentifier },
        };
      }

      void navigate({
        ...target,
        replace: true,
        search: true,
      });
    }
  }, [activePanel, canonicalTeamIdentifier, navigate]);

  const setTab = (tab: TaskViewTab) => {
    void navigate({
      to: ".",
      replace: true,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        tab: tab === getDefaultTaskViewTab(surface) ? undefined : tab,
      }),
    });
  };

  const setView = (view: ResolvedTaskViewOptions) => {
    void navigate({
      to: ".",
      replace: true,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        view: toTaskViewSearchValue(view),
      }),
    });
  };

  // Cmd/Ctrl+B flips Board <-> List (Linear's layout toggle).
  const toggleLayout = () =>
    setView({ ...activeView, mode: activeView.mode === "board" ? "list" : "board" });

  const setInsights = (insights: ResolvedInsightsState) => {
    void navigate({
      to: ".",
      replace: true,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        insights: toInsightsSearchValue(insights),
      }),
    });
  };

  const setTeamWeeksProgress = (cycleId: string | null) => {
    void navigate({
      to: ".",
      replace: true,
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        progress: cycleId ?? undefined,
      }),
    });
  };

  const content = (
    <>
      <TaskShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
      {showTopBar ? (
        <TaskViewTopBar
          surface={surface}
          tab={activeTab}
          onTabChange={setTab}
          view={activeView}
          onViewChange={setView}
          openDisplayOptionsRef={openDisplayOptionsRef}
          insightsOpen={activeInsights.open}
          onToggleInsights={() => setInsights({ ...activeInsights, open: !activeInsights.open })}
          filterFields={taskFilterFields as ReadonlyArray<ColumnConfig<unknown>>}
          filters={taskFilters}
          onFiltersChange={setTaskFilters}
          onCreateTask={() =>
            openCreateTask({
              assignTo: activePanel === "my_work" ? currentUserId : null,
              // On a Team Board the picker is preset to that Team (ADR 0013).
              teamId: selectedTeam?.id ?? null,
              ...(topBarTargetCycle ? { targetCycle: topBarTargetCycle } : {}),
            })
          }
        />
      ) : null}
      {typeof activePanel === "object" && !selectedTeam ? (
        <section className="grid gap-4 rounded-xl border bg-background p-4 shadow-xs">
          <h2 className="text-base font-semibold">Team board</h2>
          {teams.loading ? (
            <Skeleton className="h-4 w-44" />
          ) : (
            <p className="text-sm text-muted-foreground">Team board is unavailable.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {unavailableTeamBoardActions.map((action) => (
              <Button
                key={action.panel}
                type="button"
                variant={action.panel === "my_work" ? "default" : "outline"}
                onClick={() => setActivePanel(action.panel)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      ) : activeChurchId &&
        currentUserId &&
        typeof activePanel === "object" &&
        activePanel.kind === "team_weeks" &&
        selectedTeam?.identifier ? (
        <TeamWeeksIndex
          churchId={activeChurchId}
          currentUserId={currentUserId}
          progressCycleId={search.progress ?? null}
          onProgressCycleIdChange={setTeamWeeksProgress}
          team={{
            id: selectedTeam.id,
            identifier: selectedTeam.identifier,
            name: selectedTeam.name,
            color: selectedTeam.color,
          }}
          churchTimeZone={activeChurch?.churchTimeZone ?? "UTC"}
        />
      ) : activeChurchId && currentUserId ? (
        <TaskExecutionSurface
          churchId={activeChurchId}
          currentUserId={currentUserId}
          surface={surface}
          team={selectedTeam}
          teams={activeTeams.map((candidate) => ({ id: candidate.id, name: candidate.name }))}
          tab={activeTab}
          view={search.view}
          week={search.week}
          weekNumber={
            typeof activePanel === "object" && activePanel.kind === "team"
              ? activePanel.weekNumber
              : null
          }
          churchTimeZone={activeChurch?.churchTimeZone ?? "UTC"}
          insights={activeInsights}
          onInsightsChange={setInsights}
          onToggleLayout={toggleLayout}
          onOpenDisplayOptions={() => openDisplayOptionsRef.current?.()}
          onOpenShortcutsHelp={() => setShortcutsHelpOpen(true)}
        />
      ) : (
        <>
          <section className="grid gap-4 rounded-xl border bg-background p-4 shadow-xs">
            <div className="grid gap-1">
              <h2 className="text-base font-semibold">Church Home</h2>
              <p className="text-sm text-muted-foreground">
                Choose or create a Church to start organizing shared work.
              </p>
            </div>
          </section>
          <ActiveChurchInvitationPrompt />
          {activeChurch ? (
            <>
              <ChurchMembersPanel activeChurchId={activeChurch.id} />
              <ChurchInvitationPanel
                activeChurchId={activeChurch.id}
                activeChurchRole={activeChurch.role}
                pendingInvitations={pendingInvitations}
              />
            </>
          ) : null}
        </>
      )}
    </>
  );

  return (
    <MainContainer className={showBoardSurface ? "mt-0 pt-0" : undefined}>
      {showBoardSurface ? (
        <PageWrapper variant="noPageContainer" className="gap-3 pt-0 md:pt-0">
          {content}
        </PageWrapper>
      ) : (
        <PageContainer wrapperClassName="gap-6">{content}</PageContainer>
      )}
    </MainContainer>
  );
}

const ChurchNameSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.check(Schema.isMinLength(2, { message: "Church name must be at least 2 characters." })),
  ),
  churchTimeZone: Schema.String.pipe(
    Schema.check(Schema.isMinLength(1, { message: "Church Time Zone is required." })),
  ),
});

type InvitationRole = "member" | "admin";

function detectedChurchTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}

function ActiveChurchInvitationPrompt() {
  const invitations = useUserInvitationsCollection();
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const pendingInvitations = invitations.invitationsCollection;

  if (invitations.loading || (!error && pendingInvitations.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Church Invitations</CardTitle>
        <CardDescription>
          You have invitations to other Churches. Accepting one switches your Active Church.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {pendingInvitations.map((invitation) => {
          const isAccepting = acceptingInvitationId === invitation.id;

          return (
            <Item key={invitation.id} variant="outline">
              <ItemContent>
                <ItemTitle>{invitation.organizationName}</ItemTitle>
                <ItemDescription>Role: {invitationRoleLabel(invitation.role)}</ItemDescription>
              </ItemContent>
              <Button
                type="button"
                disabled={isAccepting}
                onClick={async () => {
                  setError(null);
                  setAcceptingInvitationId(invitation.id);
                  const result = await authClient.organization.acceptInvitation({
                    invitationId: invitation.id,
                  });
                  setAcceptingInvitationId(null);

                  if (result.error) {
                    setError(result.error.message ?? "Could not accept Church Invitation.");
                    return;
                  }
                }}
              >
                {isAccepting ? "Accepting..." : "Accept Invitation"}
              </Button>
            </Item>
          );
        })}
      </CardContent>
    </Card>
  );
}

function canMutateChurchSettings(role: string | string[]) {
  return memberHasRole(role, "owner") || memberHasRole(role, "admin");
}

type PendingInvitation = {
  id: string;
  email: string;
  role: string | string[];
  status: string;
};

function invitationRoleLabel(role: string | string[]) {
  return Array.isArray(role) ? role.join(", ") : role;
}

function memberHasRole(role: string | string[], expectedRole: string) {
  return Array.isArray(role) ? role.includes(expectedRole) : role === expectedRole;
}

function ChurchMembersPanel({ activeChurchId }: { activeChurchId: string }) {
  const members = useChurchUsersCollection({ churchId: activeChurchId });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Members</CardTitle>
        <CardDescription>Your membership context for the Active Church.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {members.loading ? (
          <>
            {[0, 1, 2].map((index) => (
              <Skeleton className="h-16 w-full rounded-lg" key={index} />
            ))}
          </>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}
        {!members.loading && !error && members.usersCollection.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Church Members found.</p>
        ) : null}
        {members.usersCollection.map((member) => {
          const isOwner = memberHasRole(member.role, "owner");
          const roleLabel = invitationRoleLabel(member.role);
          const isUpdating = updatingMemberId === member.memberId;
          const isRemoving = removingMemberId === member.memberId;

          return (
            <Item key={member.memberId} variant="outline">
              <ItemContent>
                <ItemTitle>{member.name ?? "Unnamed member"}</ItemTitle>
                <ItemDescription>{member.email ?? "No email"}</ItemDescription>
              </ItemContent>
              {isOwner ? (
                <Badge variant="secondary" className="capitalize">
                  {roleLabel}
                </Badge>
              ) : (
                <ItemActions className="flex-wrap">
                  <Label className="sr-only" htmlFor={`member-role-${member.memberId}`}>
                    Role for {member.email ?? member.name ?? "Church member"}
                  </Label>
                  <Select
                    value={memberHasRole(member.role, "admin") ? "admin" : "member"}
                    disabled={isUpdating || isRemoving}
                    onValueChange={async (value) => {
                      const nextRole = value as InvitationRole;
                      setError(null);
                      setSuccess(null);
                      setUpdatingMemberId(member.memberId);
                      const result = await authClient.organization.updateMemberRole({
                        organizationId: activeChurchId,
                        memberId: member.memberId,
                        role: nextRole,
                      });
                      setUpdatingMemberId(null);

                      if (result.error) {
                        setError(result.error.message ?? "Could not update Church Member role.");
                        return;
                      }

                      setSuccess(`Updated ${member.email ?? "Church Member"} to ${nextRole}.`);
                    }}
                  >
                    <SelectTrigger id={`member-role-${member.memberId}`} className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove ${member.email ?? member.name ?? "Church Member"}`}
                    disabled={isUpdating || isRemoving}
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);
                      setRemovingMemberId(member.memberId);
                      const result = await authClient.organization.removeMember({
                        organizationId: activeChurchId,
                        memberIdOrEmail: member.memberId,
                      });
                      setRemovingMemberId(null);

                      if (result.error) {
                        setError(result.error.message ?? "Could not remove Church Member.");
                        return;
                      }

                      setSuccess(`Removed ${member.email ?? "Church Member"}.`);
                    }}
                  >
                    {isRemoving ? "Removing..." : "Remove"}
                  </Button>
                </ItemActions>
              )}
            </Item>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ChurchInvitationPanel({
  activeChurchId,
  activeChurchRole,
  pendingInvitations,
}: {
  activeChurchId: string;
  activeChurchRole: string | string[];
  pendingInvitations: PendingInvitation[];
}) {
  const canInvite = canMutateChurchSettings(activeChurchRole);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1.5">
          <CardTitle>Church Invitations</CardTitle>
          <CardDescription>
            Invite people to this Church and track pending invitations.
          </CardDescription>
        </div>
        <InviteMemberButton disabled={!canInvite} size="sm" variant="secondary" />
      </CardHeader>
      <CardContent className="grid gap-3">
        {!canInvite ? (
          <Alert>
            <AlertDescription>
              Only Church owners and admins can invite Church members.
            </AlertDescription>
          </Alert>
        ) : null}
        <InviteMemberQuickAction
          activeChurchId={activeChurchId}
          activeChurchRole={activeChurchRole}
          source="settings"
        />
        <div className="grid gap-3">
          <h2 className="text-base font-semibold">Pending Invitations</h2>
          {pendingInvitations.length > 0 ? (
            <ItemGroup className="gap-2">
              {pendingInvitations.map((invitation) => (
                <Item key={invitation.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>{invitation.email}</ItemTitle>
                  </ItemContent>
                  <Badge variant="outline" className="capitalize">
                    {invitationRoleLabel(invitation.role)}
                  </Badge>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function churchSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ChurchOnboardingGate({ activePanel }: { activePanel: ActiveWorkPanel }) {
  const { currentOrgOpt: activeChurch, loading: activeChurchLoading } = useCurrentOrgOpt();
  const { data: sessionData } = authClient.useSession();
  const sessionRouting = sessionData?.session as SessionOrgRoutingFields | undefined;
  const hasActiveChurch = Boolean(activeChurch);
  const sessionHasCompletedActiveChurch = Boolean(
    sessionRouting?.activeOrganizationId && sessionRouting.orgCompletedOnboarding,
  );
  const [error, setError] = useState<string | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const pendingInvitations = useUserInvitationsCollection();
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const firstChurchForm = useAppForm({
    defaultValues: {
      name: "",
      churchTimeZone: detectedChurchTimeZone(),
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "blur",
    }),
    validators: {
      onSubmit: Schema.toStandardSchemaV1(ChurchNameSchema),
    },
    onSubmit: async ({ value }) => {
      setError(null);

      const trimmedName = value.name.trim();
      const churchTimeZone = value.churchTimeZone.trim();
      const slug = churchSlug(trimmedName);

      if (!slug) {
        setError("Church name must be at least 2 characters.");
        return;
      }

      const result = await authClient.organization.create({
        name: trimmedName,
        slug,
        churchTimeZone,
      });

      if (result.error) {
        setError(result.error.message ?? "Could not create Church.");
      }
    },
  });

  if (activeChurchLoading && !sessionHasCompletedActiveChurch) {
    return (
      <MainContainer>
        <PageContainer wrapperClassName="gap-6">
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
          <section className="grid gap-4 rounded-xl border bg-background p-4 shadow-xs">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </section>
        </PageContainer>
      </MainContainer>
    );
  }

  if (hasActiveChurch || sessionHasCompletedActiveChurch) {
    return <PrivateWorkContent activePanel={activePanel} />;
  }

  if (pendingInvitations.loading) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col justify-center p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (pendingInvitations.invitationsCollection.length > 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col justify-center p-6">
        <Card>
          <CardHeader>
            <CardTitle>Accept Church Invitation</CardTitle>
            <CardDescription>
              You have pending Church Invitations. Join one before creating a new Church.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {invitationError ? (
              <Alert variant="destructive">
                <AlertDescription>{invitationError}</AlertDescription>
              </Alert>
            ) : null}
            {pendingInvitations.invitationsCollection.map((invitation) => {
              const isAccepting = acceptingInvitationId === invitation.id;

              return (
                <Item key={invitation.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>{invitation.organizationName}</ItemTitle>
                    <ItemDescription>Role: {invitationRoleLabel(invitation.role)}</ItemDescription>
                  </ItemContent>
                  <Button
                    type="button"
                    disabled={isAccepting}
                    onClick={async () => {
                      setInvitationError(null);
                      setAcceptingInvitationId(invitation.id);
                      const result = await authClient.organization.acceptInvitation({
                        invitationId: invitation.id,
                      });
                      setAcceptingInvitationId(null);

                      if (result.error) {
                        setInvitationError(
                          result.error.message ?? "Could not accept Church Invitation.",
                        );
                        return;
                      }
                    }}
                  >
                    {isAccepting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                </Item>
              );
            })}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Your First Church</CardTitle>
          <CardDescription>
            Church Task needs an active Church before you can enter the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{invitationError}</AlertDescription>
            </Alert>
          ) : null}
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              firstChurchForm.handleSubmit();
            }}
          >
            <firstChurchForm.AppField name="name">
              {(field) => (
                <field.InputField
                  label="Church Name"
                  placeholder="Grace Community Church"
                  required
                />
              )}
            </firstChurchForm.AppField>
            <firstChurchForm.AppField name="churchTimeZone">
              {(field) => (
                <field.InputField
                  label="Church Time Zone"
                  placeholder="America/New_York"
                  required
                />
              )}
            </firstChurchForm.AppField>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <firstChurchForm.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Creating Church..." : "Create Church"}
                </Button>
              )}
            </firstChurchForm.Subscribe>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export function WorkPage({ activePanel }: { activePanel: ActiveWorkPanel }) {
  return <ChurchOnboardingGate activePanel={activePanel} />;
}
