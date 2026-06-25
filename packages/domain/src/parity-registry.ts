export const AGENT_PARITY_COVERAGE_STATUSES = [
  "covered",
  "partial",
  "missing",
  "generic-passthrough",
] as const;

export type AgentParityCoverageStatus = (typeof AGENT_PARITY_COVERAGE_STATUSES)[number];

export type AgentParitySurfaceCoverage = {
  readonly status: AgentParityCoverageStatus;
  readonly command?: string;
  readonly notes?: string;
  readonly tool?: string;
};

export type AgentOperationRegistryEntry = {
  readonly authorization: string;
  readonly context: {
    readonly requiresActiveChurch: boolean;
    readonly requiresChurchMembership: boolean;
    readonly session: "authenticated" | "anonymous";
  };
  readonly domainArea: string;
  readonly id: string;
  readonly inputContract: string;
  readonly kind: "read" | "write";
  readonly operation: string;
  readonly outputContract: string;
  readonly surfaces: {
    readonly cli: AgentParitySurfaceCoverage;
    readonly mcp: AgentParitySurfaceCoverage;
    readonly ui: AgentParitySurfaceCoverage;
  };
  readonly uiBehavior: string;
};

export const AGENT_OPERATION_REGISTRY = [
  {
    authorization: "Authenticated User",
    context: {
      requiresActiveChurch: false,
      requiresChurchMembership: false,
      session: "anonymous",
    },
    domainArea: "User",
    id: "user.current",
    inputContract: "optional browser session cookie or CLI API key bearer token",
    kind: "read",
    operation: "Read Current User",
    outputContract: "current User identity or null for an anonymous caller",
    surfaces: {
      cli: { command: "church-work current-user", status: "covered" },
      mcp: { status: "covered", tool: "GET /api/agent/current-user" },
      ui: {
        notes: "Inspected shared useSession hook and auth guard consumers.",
        status: "covered",
      },
    },
    uiBehavior:
      "Shared useSession reads the current User and allows anonymous/null while auth resolves",
  },
  {
    authorization: "Church Membership",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Church",
    id: "church.active.resolve",
    inputContract: "optional churchId override; otherwise session Active Church",
    kind: "read",
    operation: "Resolve Active Church",
    outputContract:
      "Active Church, Church Membership role, noActiveChurch state, or structured authentication/membership error",
    surfaces: {
      cli: { command: "church-work active-church", status: "covered" },
      mcp: { status: "covered", tool: "POST /api/agent/active-church" },
      ui: {
        notes:
          "Inspected useCurrentOrgOpt/useAuthGuard and Work page Active Church fallback behavior.",
        status: "covered",
      },
    },
    uiBehavior:
      "App shell and Work page resolve Active Church from session activeOrganizationId and membership-backed Church data",
  },
  {
    authorization: "Church Membership",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Task",
    id: "task.list",
    inputContract:
      "churchId plus optional surface, Week/Cycle, Team, assignee, Workflow Status, Task State, and priority filters",
    kind: "read",
    operation: "List Tasks",
    outputContract:
      "Task collection rows with Task Identifier, Team, Status, Week/Cycle, assignee, due date, and priority fields",
    surfaces: {
      cli: {
        command: "church-work task list",
        status: "covered",
      },
      mcp: {
        status: "covered",
        tool: "list-tasks",
      },
      ui: {
        notes:
          "Inspected apps/web/src/routes/-work-page.tsx and useTasksCollection in tasksData.app.ts.",
        status: "covered",
      },
    },
    uiBehavior: "Work page TaskExecutionSurface lists Tasks from useTasksCollection",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team",
    id: "team.create",
    inputContract: "churchId and Team name",
    kind: "write",
    operation: "Create Team",
    outputContract: "created Team plus creator Team Membership and default Workflow setup",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior:
      "Settings and sidebar Team creation use useCreateTeamMutation, which creates the Team, creator Team Membership, owned Workflow, and default Workflow Statuses",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team",
    id: "team.rename",
    inputContract: "churchId, teamId, and non-empty Team name",
    kind: "write",
    operation: "Rename Team",
    outputContract: "updated Team name or validation error",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior: "Team settings use useRenameTeamMutation and trim blank Team names",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team",
    id: "team.identifier.change",
    inputContract: "churchId, teamId, and 1-6 character Team Identifier",
    kind: "write",
    operation: "Change Team Identifier",
    outputContract: "updated Team Identifier with prior identifier retained as a route alias",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior:
      "Team settings use useSetTeamIdentifierMutation, normalize to uppercase, reject invalid or duplicate identifiers, and preserve previous identifiers",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team",
    id: "team.delete",
    inputContract: "churchId and teamId",
    kind: "write",
    operation: "Delete Team",
    outputContract: "soft-deleted Team plus owned Workflow and Workflow Status cleanup",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior:
      "Team settings use useDeleteTeamMutation after confirmation and remove Team Memberships for that Team",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team",
    id: "team.reorder",
    inputContract: "churchId and ordered Team IDs",
    kind: "write",
    operation: "Reorder Teams",
    outputContract: "updated Team sort_order values",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior: "Settings Team list uses useReorderTeamsMutation to persist Team order per Church",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team Membership",
    id: "team.membership.add",
    inputContract: "churchId, teamId, and userId",
    kind: "write",
    operation: "Add Team Membership",
    outputContract: "created Team Membership or no-op when it already exists",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior:
      "Team navigation membership action uses useAddTeamMemberMutation and de-duplicates existing Team Memberships",
  },
  {
    authorization: "Church owner, Church admin, or App Administrator",
    context: {
      requiresActiveChurch: true,
      requiresChurchMembership: true,
      session: "authenticated",
    },
    domainArea: "Team Membership",
    id: "team.membership.remove",
    inputContract: "churchId, teamId, and userId",
    kind: "write",
    operation: "Remove Team Membership",
    outputContract: "removed Team Membership",
    surfaces: {
      cli: { notes: "No named CLI command yet.", status: "missing" },
      mcp: { notes: "No focused MCP/API operation yet.", status: "missing" },
      ui: { status: "covered" },
    },
    uiBehavior: "Team navigation membership action uses useRemoveTeamMemberMutation",
  },
] as const satisfies ReadonlyArray<AgentOperationRegistryEntry>;

const surfaceStatus = (surface: AgentParitySurfaceCoverage) => surface.status;

const markdownTableCell = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("|", "\\|");

const contextSummary = (entry: AgentOperationRegistryEntry) =>
  [
    entry.context.session,
    entry.context.requiresActiveChurch ? "Active Church" : null,
    entry.context.requiresChurchMembership ? "Church Membership" : null,
  ]
    .filter((value): value is string => value !== null)
    .join(", ");

export const generateAgentParityReport = (
  registry: ReadonlyArray<AgentOperationRegistryEntry> = AGENT_OPERATION_REGISTRY,
) => {
  const rows = registry.map(
    (entry) =>
      `| ${[
        entry.domainArea,
        entry.operation,
        entry.kind,
        surfaceStatus(entry.surfaces.ui),
        surfaceStatus(entry.surfaces.mcp),
        surfaceStatus(entry.surfaces.cli),
        contextSummary(entry),
        entry.uiBehavior,
      ]
        .map(markdownTableCell)
        .join(" | ")} |`,
  );

  return [
    "# Church Work Agent Operation Parity Report",
    "",
    `Coverage statuses: ${AGENT_PARITY_COVERAGE_STATUSES.join(", ")}`,
    "",
    "| Domain Area | Operation | Kind | UI | MCP | CLI | Context | UI Behavior |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
};
