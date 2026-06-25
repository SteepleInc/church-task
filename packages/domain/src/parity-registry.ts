export const AGENT_PARITY_COVERAGE_STATUSES = [
  "covered",
  "partial",
  "missing",
  "generic-passthrough",
  "intentionally-ui-only",
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
    authorization: "App Administrator",
    context: {
      requiresActiveChurch: false,
      requiresChurchMembership: false,
      session: "authenticated",
    },
    domainArea: "App Administration",
    id: "app-administration.access.check",
    inputContract: "authenticated session with Better Auth User role",
    kind: "read",
    operation: "Check App Administrator Access",
    outputContract: "App Administrator access allowed or restricted support-surface state",
    surfaces: {
      cli: {
        notes: "No named CLI support command exposes app-admin authorization checks yet.",
        status: "missing",
      },
      mcp: {
        notes: "No agent endpoint exposes app-admin authorization checks yet.",
        status: "missing",
      },
      ui: {
        notes:
          "Inspected InternalAccessGate, useIsAppAdmin, AdminNav, and Zero is_app_admin context.",
        status: "covered",
      },
    },
    uiBehavior:
      "InternalAccessGate renders App Administrator access required unless useIsAppAdmin and authenticated Zero context allow support surfaces",
  },
  {
    authorization: "App Administrator",
    context: {
      requiresActiveChurch: false,
      requiresChurchMembership: false,
      session: "authenticated",
    },
    domainArea: "App Administration",
    id: "app-administration.church.collection",
    inputContract:
      "admin list args for Church collection search, sort, selection, limit, and pagination",
    kind: "read",
    operation: "List Churches for Support",
    outputContract: "Church collection rows with support details and available row actions",
    surfaces: {
      cli: { notes: "No named CLI support command lists Churches.", status: "missing" },
      mcp: { notes: "No MCP support tool lists Churches.", status: "missing" },
      ui: {
        notes:
          "Inspected /admin/orgs OrgsCollection, orgsData admin_list/admin_all queries, and OrgActions edit support action.",
        status: "covered",
      },
    },
    uiBehavior:
      "Admin Churches collection reads Zero-backed admin Church rows and shows App Administrator-only edit org row actions",
  },
  {
    authorization: "App Administrator",
    context: {
      requiresActiveChurch: false,
      requiresChurchMembership: false,
      session: "authenticated",
    },
    domainArea: "App Administration",
    id: "app-administration.user.collection",
    inputContract:
      "admin list args for User collection search, sort, selection, limit, and pagination",
    kind: "read",
    operation: "List Users for Support",
    outputContract: "User collection rows with support details and available row actions",
    surfaces: {
      cli: { notes: "No named CLI support command lists Users.", status: "missing" },
      mcp: { notes: "No MCP support tool lists Users.", status: "missing" },
      ui: {
        notes:
          "Inspected /admin/users UsersCollection, usersData admin_list/admin_all queries, and UserActions edit/impersonate support actions.",
        status: "covered",
      },
    },
    uiBehavior:
      "Admin Users collection reads Zero-backed admin User rows and shows App Administrator-only edit user and impersonate row actions",
  },
  {
    authorization: "App Administrator",
    context: {
      requiresActiveChurch: false,
      requiresChurchMembership: false,
      session: "authenticated",
    },
    domainArea: "App Administration",
    id: "app-administration.user.impersonate",
    inputContract: "target User id selected from the App Administration Users collection",
    kind: "write",
    operation: "Start User Impersonation",
    outputContract: "Better Auth impersonation session refetched into the browser session",
    surfaces: {
      cli: {
        notes:
          "Intentionally not exposed to CLI in this parity slice; impersonation remains a browser support action gated by Better Auth adminClient.",
        status: "intentionally-ui-only",
      },
      mcp: {
        notes:
          "Intentionally not exposed to MCP in this parity slice to avoid adding an agent-controlled support impersonation path.",
        status: "intentionally-ui-only",
      },
      ui: {
        notes:
          "Inspected UserActions useIsAppAdmin guard and authClient.admin.impersonateUser behavior.",
        status: "covered",
      },
    },
    uiBehavior:
      "Admin User actions call Better Auth admin.impersonateUser only after useIsAppAdmin gating",
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
