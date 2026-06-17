import {
  activeChurchResponse,
  currentUserResponse,
  formatTaskIdentifier,
  noActiveChurchResponse,
  notChurchMemberResponse,
  parseTaskIdentifier,
  TaskStatus,
  type ActiveChurchResponse,
  type CoreWorkBatchReadResponse,
  type CoreWorkBatchWriteResponse,
  type CurrentUserResponse,
} from "@church-task/domain";
import { getActivityId, getTaskId } from "@church-task/shared/get-ids";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";

import {
  activities,
  cycles,
  key_dates,
  member,
  organization,
  tasks,
  team_memberships,
  teams,
  user,
  workflow_statuses,
  workflows,
} from "@church-task/db/schema";
import type { ChurchTaskAuth } from "@church-task/auth";
import type { ChurchTaskDb } from "@church-task/db";

type AuthSession = Awaited<ReturnType<ChurchTaskAuth["api"]["getSession"]>>;
type AuthenticatedSession = NonNullable<AuthSession>;

type AgentServices = {
  readonly auth: ChurchTaskAuth;
  readonly db: ChurchTaskDb;
};

const json = (body: unknown, init?: ResponseInit) => Response.json(body, init);

const readBody = (request: Request) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: async () => (await request.json()) as Record<string, unknown>,
  });

const getAuthSession = ({ auth }: AgentServices, request: Request) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: () => auth.api.getSession({ headers: request.headers }),
  });

const requireAuthSession = (services: AgentServices, request: Request) =>
  Effect.flatMap(getAuthSession(services, request), (session) =>
    session ? Effect.succeed(session) : Effect.fail(new Error("Authentication required.")),
  );

const getRequestedChurchId = (body: Record<string, unknown>) => {
  const churchId = body.churchId ?? body.church_id;
  return typeof churchId === "string" && churchId.trim() ? churchId.trim() : null;
};

const ensureChurchMembership = (
  db: ChurchTaskDb,
  session: AuthenticatedSession,
  churchId: string,
) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: async () => {
      const [membership] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.userId, session.user.id), eq(member.organizationId, churchId)))
        .limit(1);

      if (!membership)
        throw new Error("User does not have Church Membership for requested Church.");
      return membership;
    },
  });

const toTaskDto = (
  task: typeof tasks.$inferSelect,
  team?: Pick<typeof teams.$inferSelect, "identifier">,
) => ({
  assignedUserId: task.assigned_user_id,
  boardOrder: task.board_order,
  churchId: task.church_id,
  cycleId: task.cycle_id,
  dueDate: task.due_date,
  finishedAt: task.finished_at?.toISOString() ?? null,
  id: task.id,
  identifier: team ? formatTaskIdentifier(team.identifier, task.number) : undefined,
  number: task.number,
  parentTaskId: task.parent_task_id,
  taskState: task.task_state,
  teamId: task.team_id,
  title: task.title,
  workflowId: task.workflow_id,
  workflowStatusId: task.workflow_status_id,
});

const recordTaskActivity = (
  db: ChurchTaskDb,
  args: {
    readonly actorId: string;
    readonly churchId: string;
    readonly entityId: string;
    readonly eventType: string;
  },
) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: () =>
      db.insert(activities).values({
        _tag: "activity",
        actor_id: args.actorId,
        actor_type: "user",
        church_id: args.churchId,
        created_by: args.actorId,
        entity_id: args.entityId,
        entity_type: "task",
        event_type: args.eventType,
        id: getActivityId(),
        occurred_at: new Date(),
        updated_by: args.actorId,
      }),
  });

const resolveTask = (db: ChurchTaskDb, body: Record<string, unknown>) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: async () => {
      const churchId = getRequestedChurchId(body);
      if (!churchId) throw new Error("churchId is required.");

      const taskId = typeof body.taskId === "string" ? body.taskId : null;
      if (taskId) {
        const [task] = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.church_id, churchId), eq(tasks.id, taskId), isNull(tasks.deleted_at)))
          .limit(1);
        if (!task) throw new Error("Task not found.");
        return task;
      }

      const identifier =
        typeof body.taskIdentifier === "string" ? parseTaskIdentifier(body.taskIdentifier) : null;
      if (!identifier) throw new Error("taskId or taskIdentifier is required.");

      const [team] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(
            eq(teams.church_id, churchId),
            eq(teams.identifier, identifier.teamIdentifier),
            isNull(teams.deleted_at),
          ),
        )
        .limit(1);
      if (!team) throw new Error("Task not found.");

      const [task] = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.church_id, churchId),
            eq(tasks.team_id, team.id),
            eq(tasks.number, identifier.taskNumber),
            isNull(tasks.deleted_at),
          ),
        )
        .limit(1);
      if (!task) throw new Error("Task not found.");
      return task;
    },
  });

const listTeams = (db: ChurchTaskDb, churchId: string) =>
  db
    .select()
    .from(teams)
    .where(and(eq(teams.church_id, churchId), isNull(teams.deleted_at)))
    .orderBy(asc(teams.sort_order));

const listWorkflowStatuses = (db: ChurchTaskDb, churchId: string, workflowId?: string) =>
  db
    .select()
    .from(workflow_statuses)
    .where(
      and(
        eq(workflow_statuses.church_id, churchId),
        workflowId ? eq(workflow_statuses.workflow_id, workflowId) : undefined,
        isNull(workflow_statuses.deleted_at),
      ),
    )
    .orderBy(asc(workflow_statuses.sort_order));

const runBatchReadOperation = (
  services: AgentServices,
  operation: string,
  input: Record<string, unknown>,
) =>
  Effect.tryPromise({
    catch: (cause) => cause,
    try: async () => {
      const churchId = getRequestedChurchId(input);
      if (!churchId) throw new Error("churchId is required.");

      switch (operation) {
        case "listTeams":
          return { ok: true, operation, data: { teams: await listTeams(services.db, churchId) } };
        case "listTeamMemberships":
          return {
            ok: true,
            operation,
            data: {
              teamMemberships: await services.db
                .select()
                .from(team_memberships)
                .where(eq(team_memberships.church_id, churchId)),
            },
          };
        case "readWorkDefaults":
          return {
            ok: true,
            operation,
            data: {
              keyDates: await services.db
                .select()
                .from(key_dates)
                .where(eq(key_dates.church_id, churchId)),
              workflowStatuses: await listWorkflowStatuses(services.db, churchId),
              workflows: await services.db
                .select()
                .from(workflows)
                .where(eq(workflows.church_id, churchId)),
            },
          };
        case "readChurchSettings": {
          const [church] = await services.db
            .select({ churchTimeZone: organization.churchTimeZone, id: organization.id })
            .from(organization)
            .where(eq(organization.id, churchId))
            .limit(1);
          return { ok: true, operation, data: { church } };
        }
        default:
          return {
            ok: false,
            operation,
            error: {
              code: "obsolete_operation",
              message: "Operation is not implemented on the new agent API.",
            },
          };
      }
    },
  });

const runTaskTool = (
  services: AgentServices,
  session: AuthenticatedSession,
  tool: string,
  body: Record<string, unknown>,
) =>
  Effect.gen(function* () {
    const churchId = getRequestedChurchId(body);
    if (!churchId)
      return json(
        { ok: false, error: { code: "missing_church", message: "churchId is required." } },
        { status: 400 },
      );
    yield* ensureChurchMembership(services.db, session, churchId);

    switch (tool) {
      case "list-users": {
        const users = yield* Effect.tryPromise({
          catch: (cause) => cause,
          try: () =>
            services.db
              .select({ email: user.email, id: user.id, name: user.name, role: member.role })
              .from(member)
              .innerJoin(user, eq(user.id, member.userId))
              .where(eq(member.organizationId, churchId)),
        });
        return json({ ok: true, tool, users });
      }
      case "list-teams":
        return json({
          ok: true,
          teams: yield* Effect.promise(() => listTeams(services.db, churchId)),
          tool,
        });
      case "list-cycles":
        return json({
          cycles: yield* Effect.promise(() =>
            services.db
              .select()
              .from(cycles)
              .where(and(eq(cycles.church_id, churchId), isNull(cycles.deleted_at)))
              .orderBy(desc(cycles.start_date)),
          ),
          ok: true,
          tool,
        });
      case "list-workflow-statuses": {
        const workflowId = typeof body.workflowId === "string" ? body.workflowId : undefined;
        return json({
          ok: true,
          tool,
          workflowStatuses: yield* Effect.promise(() =>
            listWorkflowStatuses(services.db, churchId, workflowId),
          ),
        });
      }
      case "list-tasks": {
        const rows = yield* Effect.tryPromise({
          catch: (cause) => cause,
          try: () =>
            services.db
              .select({ task: tasks, team: { identifier: teams.identifier } })
              .from(tasks)
              .innerJoin(teams, eq(teams.id, tasks.team_id))
              .where(and(eq(tasks.church_id, churchId), isNull(tasks.deleted_at)))
              .orderBy(asc(tasks.board_order)),
        });
        return json({ ok: true, tasks: rows.map((row) => toTaskDto(row.task, row.team)), tool });
      }
      case "get-task": {
        const task = yield* resolveTask(services.db, body);
        const [team] = yield* Effect.promise(() =>
          services.db
            .select({ identifier: teams.identifier })
            .from(teams)
            .where(eq(teams.id, task.team_id))
            .limit(1),
        );
        return json({ ok: true, task: toTaskDto(task, team), tool });
      }
      case "create-task": {
        const teamId = typeof body.teamId === "string" ? body.teamId : null;
        const statusId = typeof body.workflowStatusId === "string" ? body.workflowStatusId : null;
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!teamId || !statusId || !title)
          throw new Error("teamId, workflowStatusId, and title are required.");

        const [team] = yield* Effect.promise(() =>
          services.db
            .select()
            .from(teams)
            .where(and(eq(teams.id, teamId), eq(teams.church_id, churchId)))
            .limit(1),
        );
        const [status] = yield* Effect.promise(() =>
          services.db
            .select()
            .from(workflow_statuses)
            .where(
              and(eq(workflow_statuses.id, statusId), eq(workflow_statuses.church_id, churchId)),
            )
            .limit(1),
        );
        if (!team || !status) throw new Error("Team or Workflow Status not found.");

        const task = {
          _tag: "task",
          assigned_user_id: typeof body.assignedUserId === "string" ? body.assignedUserId : null,
          board_order: String(Date.now()),
          church_id: churchId,
          created_by: session.user.id,
          created_by_user_id: session.user.id,
          cycle_id: null,
          due_date: typeof body.dueDate === "string" ? body.dueDate : null,
          id: getTaskId(),
          number: team.next_task_number,
          parent_task_id: typeof body.parentTaskId === "string" ? body.parentTaskId : null,
          task_state: status.task_state,
          team_id: team.id,
          title,
          updated_by: session.user.id,
          workflow_id: status.workflow_id,
          workflow_status_id: status.id,
        } satisfies typeof tasks.$inferInsert;

        const [inserted] = yield* Effect.promise(() =>
          services.db.insert(tasks).values(task).returning(),
        );
        yield* Effect.promise(() =>
          services.db
            .update(teams)
            .set({ next_task_number: team.next_task_number + 1 })
            .where(eq(teams.id, team.id)),
        );
        yield* recordTaskActivity(services.db, {
          actorId: session.user.id,
          churchId,
          entityId: task.id,
          eventType: "task.created",
        });
        return json({
          ok: true,
          task: toTaskDto(inserted!, team),
          tool,
        });
      }
      case "update-task":
      case "complete-task":
      case "cancel-task":
      case "reopen-task": {
        const existing = yield* resolveTask(services.db, body);
        const patch: Partial<typeof tasks.$inferInsert> = { updated_by: session.user.id };
        let eventType = "task.updated";

        if (tool === "update-task") {
          if (typeof body.title === "string") patch.title = body.title;
          if (typeof body.dueDate === "string" || body.dueDate === null)
            patch.due_date = body.dueDate;
          if (typeof body.cycleId === "string" || body.cycleId === null)
            patch.cycle_id = body.cycleId;
          if (typeof body.assignedUserId === "string" || body.assignedUserId === null)
            patch.assigned_user_id = body.assignedUserId;
          if (typeof body.parentTaskId === "string" || body.parentTaskId === null)
            patch.parent_task_id = body.parentTaskId;
          if (typeof body.teamId === "string") patch.team_id = body.teamId;
          if (typeof body.workflowStatusId === "string") {
            const [status] = yield* Effect.promise(() =>
              services.db
                .select()
                .from(workflow_statuses)
                .where(
                  and(
                    eq(workflow_statuses.id, body.workflowStatusId as string),
                    eq(workflow_statuses.church_id, churchId),
                  ),
                )
                .limit(1),
            );
            if (!status) throw new Error("Workflow Status not found.");
            patch.workflow_id = status.workflow_id;
            patch.workflow_status_id = status.id;
            patch.task_state = status.task_state;
            eventType = "task.status_moved";
          }
        } else {
          const targetState =
            tool === "complete-task"
              ? TaskStatus.done
              : tool === "cancel-task"
                ? TaskStatus.canceled
                : TaskStatus.todo;
          patch.task_state = targetState;
          patch.finished_at = targetState === TaskStatus.todo ? null : new Date();
          eventType =
            tool === "complete-task"
              ? "task.completed"
              : tool === "cancel-task"
                ? "task.canceled"
                : "task.reopened";
        }

        const [updated] = yield* Effect.promise(() =>
          services.db.update(tasks).set(patch).where(eq(tasks.id, existing.id)).returning(),
        );
        yield* recordTaskActivity(services.db, {
          actorId: session.user.id,
          churchId,
          entityId: existing.id,
          eventType,
        });
        return json({ ok: true, task: toTaskDto(updated ?? existing), tool });
      }
      default:
        return json(
          { ok: false, error: { code: "unknown_tool", message: "Unknown MCP tool." } },
          { status: 404 },
        );
    }
  });

export const handleAgentRequest = (services: AgentServices, request: Request) => {
  const url = new URL(request.url);

  const effect = Effect.gen(function* () {
    if (url.pathname === "/api/agent/current-user" && request.method === "GET") {
      const session = yield* getAuthSession(services, request);
      const response: CurrentUserResponse = currentUserResponse(
        session
          ? {
              email: session.user.email ?? null,
              id: session.user.id,
              name: session.user.name ?? null,
            }
          : null,
      );
      return json(response);
    }

    if (url.pathname === "/api/agent/active-church" && request.method === "POST") {
      const session = yield* requireAuthSession(services, request);
      const body = yield* readBody(request);
      const churchId =
        getRequestedChurchId(body) ??
        (session.session.activeOrganizationId as string | null | undefined) ??
        null;
      if (!churchId) return json(noActiveChurchResponse());

      const [membership] = yield* Effect.promise(() =>
        services.db
          .select({ role: member.role })
          .from(member)
          .where(and(eq(member.userId, session.user.id), eq(member.organizationId, churchId)))
          .limit(1),
      );
      if (!membership) return json(notChurchMemberResponse(), { status: 403 });

      const [church] = yield* Effect.promise(() =>
        services.db
          .select({
            churchTimeZone: organization.churchTimeZone,
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          })
          .from(organization)
          .where(eq(organization.id, churchId))
          .limit(1),
      );
      const response: ActiveChurchResponse = church
        ? activeChurchResponse({ church, membership })
        : noActiveChurchResponse();
      return json(response, response.ok ? undefined : { status: 403 });
    }

    if (url.pathname === "/api/agent/core-work/batch-read" && request.method === "POST") {
      const session = yield* requireAuthSession(services, request);
      const body = yield* readBody(request);
      const operations = Array.isArray(body.operations) ? body.operations : [];
      const results = yield* Effect.forEach(operations, (raw) => {
        const operation = raw as { id?: unknown; input?: unknown; operation?: unknown };
        const input =
          operation.input && typeof operation.input === "object"
            ? (operation.input as Record<string, unknown>)
            : {};
        const churchId = getRequestedChurchId(input);
        return Effect.gen(function* () {
          if (churchId) yield* ensureChurchMembership(services.db, session, churchId);
          return {
            id: typeof operation.id === "string" ? operation.id : "unknown",
            operation: typeof operation.operation === "string" ? operation.operation : "unknown",
            result: yield* runBatchReadOperation(
              services,
              typeof operation.operation === "string" ? operation.operation : "unknown",
              input,
            ),
          };
        });
      });
      const response: CoreWorkBatchReadResponse = {
        ok: true,
        operation: "coreWorkBatchRead",
        results,
      };
      return json(response);
    }

    if (url.pathname === "/api/agent/core-work/batch-write" && request.method === "POST") {
      yield* requireAuthSession(services, request);
      const body = yield* readBody(request);
      const operations = Array.isArray(body.operations) ? body.operations : [];
      const response: CoreWorkBatchWriteResponse = {
        ok: true,
        operation: "coreWorkBatchWrite",
        results: operations.map((raw) => {
          const operation = raw as { id?: unknown; operation?: unknown };
          return {
            id: typeof operation.id === "string" ? operation.id : "unknown",
            operation: typeof operation.operation === "string" ? operation.operation : "unknown",
            result: {
              ok: false,
              error: {
                code: "obsolete_operation",
                message: "Use focused MCP/API operations on the new Drizzle service layer.",
              },
            },
          };
        }),
      };
      return json(response);
    }

    if (url.pathname.startsWith("/api/mcp/tools/") && request.method === "POST") {
      const session = yield* requireAuthSession(services, request);
      const body = yield* readBody(request);
      return yield* runTaskTool(services, session, url.pathname.split("/").at(-1) ?? "", body);
    }

    return null;
  });

  return Effect.runPromise(effect).catch((cause) =>
    json(
      { error: cause instanceof Error ? cause.message : "Agent operation failed." },
      { status: 500 },
    ),
  );
};
