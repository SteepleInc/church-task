import { createAuth, createLocalOtpStore } from "@church-task/auth";
import { bootstrapChurchOnboarding, createDb } from "@church-task/db";
import {
  demo_items,
  invitation,
  labels,
  member,
  organization,
  session as sessionTable,
  tasks,
  teams,
  user,
  workflow_statuses,
  workflows,
} from "@church-task/db/schema";
import { getChurchInvitationId } from "@church-task/shared/get-ids";
import { anonymousServerContext, mutators, queries, schema } from "@church-task/zero";
import { handleMutateRequest, handleQueryRequest } from "@rocicorp/zero/server";
import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";
import { mustGetMutator, mustGetQuery } from "@rocicorp/zero";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { Effect } from "effect";

import type { OptionalZeroSessionContext } from "@church-task/zero";
import { handleAgentRequest } from "./agent-operations";

const getSessionContext = async (
  auth: ReturnType<typeof createAuth>["auth"],
  db: ReturnType<typeof createDb>["db"],
  request: Request,
): Promise<OptionalZeroSessionContext> => {
  const authSession = await auth.api.getSession({ headers: request.headers });

  if (!authSession) {
    return anonymousServerContext();
  }

  const session = authSession.session as typeof authSession.session & {
    readonly activeOrganizationId?: string | null;
    readonly orgRole?: string | null;
    readonly userRole?: string | null;
  };
  const activeChurchId = session.activeOrganizationId ?? null;
  const [membership] = activeChurchId
    ? await db
        .select({ role: member.role })
        .from(member)
        .where(
          and(eq(member.organizationId, activeChurchId), eq(member.userId, authSession.user.id)),
        )
        .limit(1)
    : [];

  return {
    authenticated: true,
    active_church_id: activeChurchId,
    church_role: session.orgRole ?? membership?.role ?? null,
    is_app_admin: session.userRole === "admin",
    runtime: "server",
    session_id: authSession.session.id,
    user_id: authSession.user.id,
  };
};

const toResponse = (result: unknown) =>
  result instanceof Response ? result : Response.json(result);

const ensureZeroMutationStorageForSchema = async (
  db: ReturnType<typeof createDb>["db"],
  schemaName: string,
) => {
  if (!/^[A-Za-z0-9_]+$/.test(schemaName)) {
    throw new Error(`Invalid Zero mutation storage schema: ${schemaName}`);
  }

  await db.execute(sql.raw(`create schema if not exists "${schemaName}"`));
  await db.execute(
    sql.raw(`
      create table if not exists "${schemaName}"."clients" (
        "clientGroupID" text not null,
        "clientID" text not null,
        "lastMutationID" bigint,
        primary key ("clientGroupID", "clientID")
      )
    `),
  );
  await db.execute(
    sql.raw(`
      create table if not exists "${schemaName}"."mutations" (
        "clientGroupID" text not null,
        "clientID" text not null,
        "mutationID" bigint not null,
        "result" json,
        primary key ("clientGroupID", "clientID", "mutationID")
      )
    `),
  );
};

const ensureZeroMutationStorageForApp = async (
  db: ReturnType<typeof createDb>["db"],
  zeroAppId: string,
) => ensureZeroMutationStorageForSchema(db, `${zeroAppId}_0`);

const ensureZeroMutationStorage = async (db: ReturnType<typeof createDb>["db"]) => {
  const zeroAppId = process.env.ZERO_APP_ID ?? "tracer";
  await ensureZeroMutationStorageForApp(db, zeroAppId);
};

const isMissingZeroMutationStorageError = (cause: unknown): boolean => {
  if (!(cause instanceof Error)) return false;

  const message = cause.message;
  if (message.includes("does not exist")) {
    return message.includes("clients") || message.includes("mutations");
  }

  return isMissingZeroMutationStorageError(cause.cause);
};

const getMissingZeroAppId = (cause: unknown): string | null => {
  if (!(cause instanceof Error)) return null;

  const match = cause.message.match(
    /(?:"([^"]+)_0"\.(?:clients|mutations)|relation "([^"]+)_0\.(?:clients|mutations)")/,
  );
  if (match?.[1]) return match[1];
  if (match?.[2]) return match[2];

  return getMissingZeroAppId(cause.cause);
};

export const createTracerApi = (databaseUrl: string) => {
  const { db, pool } = createDb(databaseUrl);
  const otpStore = createLocalOtpStore();
  const authRuntime = createAuth(databaseUrl, otpStore);
  const zeroDb = zeroDrizzle(schema, db);
  const getQuery = (name: string) =>
    mustGetQuery(queries, name) as { fn: (input: unknown) => unknown };
  const getMutator = (name: string) =>
    mustGetMutator(mutators, name) as { fn: (input: unknown) => Promise<unknown> };

  const handleHealth = () =>
    Effect.succeed(
      Response.json({
        ok: true,
        service: "@church-task/server",
      }),
    );

  const handleCreateDemoItem = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const context = await getSessionContext(authRuntime.auth, db, request);
        const body = (await request.json()) as { name?: string };
        const mutator = getMutator("demo_items.create");

        await zeroDb.transaction(async (tx) => {
          await mutator.fn({
            args: { name: body.name ?? "Tracer item" },
            ctx: context,
            tx,
          });
        });

        const [row] = await db
          .select()
          .from(demo_items)
          .where(eq(demo_items.name, body.name ?? "Tracer item"))
          .limit(1);

        return Response.json({ item: row });
      },
    });

  const handleZeroQuery = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const ctx = await getSessionContext(authRuntime.auth, db, request);

        return handleQueryRequest(
          (name, args): any =>
            getQuery(name).fn({
              args,
              ctx,
            }),
          schema,
          request,
        ).then(toResponse);
      },
    });

  const handleZeroMutate = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const upstreamSchema = new URL(request.url).searchParams.get("schema");
        if (upstreamSchema) await ensureZeroMutationStorageForSchema(db, upstreamSchema);
        await ensureZeroMutationStorage(db);

        const mutate = () =>
          handleMutateRequest(
            zeroDb,
            (transact) =>
              transact(async (tx, name, args) => {
                const ctx = await getSessionContext(authRuntime.auth, db, request);
                await getMutator(name).fn({
                  args,
                  ctx,
                  tx,
                });
              }),
            request.clone(),
          ).then(toResponse);

        try {
          return await mutate();
        } catch (cause) {
          if (!isMissingZeroMutationStorageError(cause)) throw cause;

          const missingAppId = getMissingZeroAppId(cause);
          if (missingAppId) await ensureZeroMutationStorageForApp(db, missingAppId);
          await ensureZeroMutationStorage(db);
          return await mutate();
        }
      },
    });

  const handleTestOtp = (request: Request) =>
    Effect.sync(() => {
      const url = new URL(request.url);
      const email = url.searchParams.get("email")?.trim();

      if (!email) {
        return Response.json({ ok: false, otp: null }, { status: 400 });
      }

      const captured = otpStore.getLatestOtp(email, "sign-in");

      if (!captured) {
        return Response.json({ ok: false, otp: null }, { status: 404 });
      }

      return Response.json({ ok: true, email, otp: captured.otp });
    });

  const handleBootstrapActiveChurch = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const context = await getSessionContext(authRuntime.auth, db, request);
        if (!context?.authenticated || !context.active_church_id || !context.user_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        await bootstrapChurchOnboarding(db, {
          church_id: context.active_church_id,
          user_id: context.user_id,
        });

        const teamRows = await db
          .select({ id: teams.id })
          .from(teams)
          .where(eq(teams.church_id, context.active_church_id));

        return Response.json({ ok: true, teams: teamRows.length });
      },
    });

  const handleTestTeamMutation = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        if (process.env.NODE_ENV === "production") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const context = await getSessionContext(authRuntime.auth, db, request);
        if (!context?.authenticated || !context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const body = (await request.json()) as {
          action?: string;
          churchId?: string;
          identifier?: string;
          name?: string;
          teamId?: string;
        };

        if (!body.churchId || body.churchId !== context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const actionToMutator = {
          create: "teams.create",
          delete: "teams.delete",
          rename: "teams.rename",
          set_identifier: "teams.set_identifier",
        } as const;
        const mutatorName = actionToMutator[body.action as keyof typeof actionToMutator];
        if (!mutatorName) {
          return Response.json({ error: "Unsupported Team mutation" }, { status: 400 });
        }

        await zeroDb.transaction(async (tx) => {
          await getMutator(mutatorName).fn({
            args: {
              church_id: body.churchId,
              identifier: body.identifier,
              name: body.name,
              team_id: body.teamId,
            },
            ctx: context,
            tx,
          });
        });

        return Response.json({ ok: true });
      },
    });

  const handleTestLabelMutation = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        if (process.env.NODE_ENV === "production") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const context = await getSessionContext(authRuntime.auth, db, request);
        if (!context?.authenticated || !context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const body = (await request.json()) as {
          action?: string;
          churchId?: string;
          color?: string;
          labelId?: string;
          name?: string;
        };

        if (!body.churchId || body.churchId !== context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const actionToMutator = {
          create: "labels.create",
          delete: "labels.delete",
          update: "labels.update",
        } as const;
        const mutatorName = actionToMutator[body.action as keyof typeof actionToMutator];
        if (!mutatorName) {
          return Response.json({ error: "Unsupported Label mutation" }, { status: 400 });
        }

        await zeroDb.transaction(async (tx) => {
          await getMutator(mutatorName).fn({
            args: {
              church_id: body.churchId,
              color: body.color,
              label_id: body.labelId,
              name: body.name,
            },
            ctx: context,
            tx,
          });
        });

        return Response.json({ ok: true });
      },
    });

  const handleTestTaskMutation = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        if (process.env.NODE_ENV === "production") {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const context = await getSessionContext(authRuntime.auth, db, request);
        if (!context?.authenticated || !context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const body = (await request.json()) as {
          action?: string;
          assignedUserId?: string | null;
          churchId?: string;
          description?: string | null;
          dueDate?: string | null;
          estimate?: string | null;
          fields?: Record<string, unknown>;
          labelIds?: readonly string[];
          parentTaskId?: string | null;
          taskId?: string;
          teamId?: string;
          title?: string;
          updates?: readonly {
            readonly taskId: string;
            readonly fields: Record<string, unknown>;
          }[];
          workflowStatusId?: string;
        };

        if (!body.churchId || body.churchId !== context.active_church_id) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const actionToMutator = {
          cancel: "tasks.cancel",
          complete: "tasks.complete",
          create: "tasks.create",
          reopen: "tasks.reopen",
          update: "tasks.update",
          update_batch: "tasks.update_batch",
        } as const;
        const mutatorName = actionToMutator[body.action as keyof typeof actionToMutator];
        if (!mutatorName) {
          return Response.json({ error: "Unsupported Task mutation" }, { status: 400 });
        }

        await zeroDb.transaction(async (tx) => {
          await getMutator(mutatorName).fn({
            args:
              body.action === "create"
                ? {
                    assigned_user_id: body.assignedUserId ?? null,
                    church_id: body.churchId,
                    description: body.description ?? null,
                    due_date: body.dueDate ?? null,
                    estimate: body.estimate ?? null,
                    label_ids: [...(body.labelIds ?? [])],
                    parent_task_id: body.parentTaskId ?? null,
                    team_id: body.teamId,
                    title: body.title,
                    workflow_status_id: body.workflowStatusId,
                  }
                : body.action === "update"
                  ? { church_id: body.churchId, fields: body.fields ?? {}, task_id: body.taskId }
                  : body.action === "update_batch"
                    ? {
                        church_id: body.churchId,
                        updates: (body.updates ?? []).map((update) => ({
                          fields: update.fields,
                          task_id: update.taskId,
                        })),
                      }
                    : { church_id: body.churchId, task_id: body.taskId },
            ctx: context,
            tx,
          });
        });

        if (body.action !== "create") return Response.json({ ok: true });

        const [createdTask] = await db
          .select({ id: tasks.id, identifier: teams.identifier, number: tasks.number })
          .from(tasks)
          .innerJoin(teams, eq(teams.id, tasks.team_id))
          .where(and(eq(tasks.church_id, body.churchId), eq(tasks.title, body.title ?? "")))
          .orderBy(desc(tasks.created_at))
          .limit(1);

        return Response.json({
          ok: true,
          tasks: createdTask
            ? [
                {
                  id: createdTask.id,
                  identifier: `${createdTask.identifier}-${createdTask.number}`,
                },
              ]
            : [],
        });
      },
    });

  const handleOnboardingTeams = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const context = await getSessionContext(authRuntime.auth, db, request);
        const url = new URL(request.url);
        const churchId = url.searchParams.get("churchId");

        if (
          !context?.authenticated ||
          !context.active_church_id ||
          !churchId ||
          context.active_church_id !== churchId
        ) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const teamRows = await db
          .select({
            color: teams.color,
            id: teams.id,
            identifier: teams.identifier,
            name: teams.name,
            sortOrder: teams.sort_order,
          })
          .from(teams)
          .where(and(eq(teams.church_id, churchId), isNull(teams.deleted_at)))
          .orderBy(asc(teams.sort_order));

        return Response.json({ teams: teamRows });
      },
    });

  const handleOnboardingWorkflows = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const context = await getSessionContext(authRuntime.auth, db, request);
        const url = new URL(request.url);
        const churchId = url.searchParams.get("churchId");

        if (
          !context?.authenticated ||
          !context.active_church_id ||
          !churchId ||
          context.active_church_id !== churchId
        ) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const workflowRows = await db
          .select({
            id: workflows.id,
            name: workflows.name,
            sortOrder: teams.sort_order,
            teamId: workflows.team_id,
          })
          .from(workflows)
          .innerJoin(teams, eq(teams.id, workflows.team_id))
          .where(and(eq(workflows.church_id, churchId), isNull(workflows.deleted_at)))
          .orderBy(asc(teams.sort_order));
        const statusRows = await db
          .select({
            id: workflow_statuses.id,
            key: workflow_statuses.key,
            name: workflow_statuses.name,
            sortOrder: workflow_statuses.sort_order,
            taskState: workflow_statuses.task_state,
            workflowId: workflow_statuses.workflow_id,
          })
          .from(workflow_statuses)
          .where(
            and(eq(workflow_statuses.church_id, churchId), isNull(workflow_statuses.deleted_at)),
          )
          .orderBy(asc(workflow_statuses.sort_order));

        return Response.json({
          statuses: statusRows.map((statusRow) => ({ ...statusRow, archivedAt: null })),
          workflows: workflowRows.map((workflowRow) => ({
            ...workflowRow,
            archivedAt: null,
            key: workflowRow.teamId,
          })),
        });
      },
    });

  const requireActiveChurch = async (request: Request, churchId: string | null) => {
    const context = await getSessionContext(authRuntime.auth, db, request);
    if (
      !context?.authenticated ||
      !context.active_church_id ||
      !churchId ||
      context.active_church_id !== churchId
    ) {
      return {
        context,
        response: Response.json({ error: "Active Church session is required" }, { status: 401 }),
      };
    }

    return { context, response: null };
  };

  const handleOnboardingLabels = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const churchId = new URL(request.url).searchParams.get("churchId");
        const active = await requireActiveChurch(request, churchId);
        if (active.response) return active.response;
        const activeChurchId = churchId;
        if (!activeChurchId) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const labelRows = await db
          .select({
            churchId: labels.church_id,
            color: labels.color,
            createdAt: labels.created_at,
            id: labels.id,
            name: labels.name,
            teamId: labels.team_id,
          })
          .from(labels)
          .where(and(eq(labels.church_id, activeChurchId), isNull(labels.deleted_at)))
          .orderBy(asc(labels.created_at));
        const taskRows = await db
          .select({ labelIds: tasks.label_ids })
          .from(tasks)
          .where(and(eq(tasks.church_id, activeChurchId), isNull(tasks.deleted_at)));

        return Response.json({
          labels: labelRows.map((label) => ({
            ...label,
            createdAt: label.createdAt?.getTime() ?? 0,
            lastAppliedAt: null,
            taskCount: taskRows.filter((task) => {
              try {
                return (JSON.parse(task.labelIds) as unknown[]).includes(label.id);
              } catch {
                return false;
              }
            }).length,
          })),
        });
      },
    });

  const handleOnboardingTasks = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const churchId = new URL(request.url).searchParams.get("churchId");
        const active = await requireActiveChurch(request, churchId);
        if (active.response) return active.response;
        const activeChurchId = churchId;
        if (!activeChurchId) {
          return Response.json({ error: "Active Church session is required" }, { status: 401 });
        }

        const taskRows = await db
          .select({
            assignedUserId: tasks.assigned_user_id,
            boardOrder: tasks.board_order,
            churchId: tasks.church_id,
            createdAt: tasks.created_at,
            createdByUserId: tasks.created_by_user_id,
            cycleId: tasks.cycle_id,
            description: tasks.description,
            dueDate: tasks.due_date,
            estimate: tasks.estimate,
            finishedAt: tasks.finished_at,
            id: tasks.id,
            labelIds: tasks.label_ids,
            number: tasks.number,
            parentTaskId: tasks.parent_task_id,
            previousIdentifiers: tasks.previous_identifiers,
            sourceTemplateCycleId: tasks.source_template_cycle_id,
            sourceTemplateId: tasks.source_template_id,
            sourceTemplateSyncEnabled: tasks.source_template_sync_enabled,
            sourceTemplateTaskId: tasks.source_template_task_id,
            taskState: tasks.task_state,
            teamId: tasks.team_id,
            teamIdentifier: teams.identifier,
            title: tasks.title,
            workflowId: tasks.workflow_id,
            workflowStatusId: tasks.workflow_status_id,
          })
          .from(tasks)
          .innerJoin(teams, eq(teams.id, tasks.team_id))
          .where(and(eq(tasks.church_id, activeChurchId), isNull(tasks.deleted_at)))
          .orderBy(asc(tasks.created_at));

        const parseIds = (value: string) => {
          try {
            const parsed = JSON.parse(value) as unknown;
            return Array.isArray(parsed)
              ? parsed.filter((item): item is string => typeof item === "string")
              : [];
          } catch {
            return [];
          }
        };

        return Response.json({
          tasks: taskRows.map((task) => ({
            ...task,
            createdAt: task.createdAt?.getTime() ?? 0,
            cycleId: task.cycleId ?? "",
            finishedAt: task.finishedAt?.toISOString() ?? null,
            identifier: `${task.teamIdentifier}-${task.number}`,
            labelIds: parseIds(task.labelIds),
            previousIdentifiers: parseIds(task.previousIdentifiers),
          })),
        });
      },
    });

  const handleAdminCollections = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const admin = await requireAppAdmin(request);
        if (admin.response) return admin.response;

        const orgRows = await db.select().from(organization).orderBy(desc(organization.createdAt));
        const memberRows = await db.select().from(member);
        const teamRows = await db.select().from(teams).where(isNull(teams.deleted_at));
        const userRows = await db.select().from(user).orderBy(desc(user.createdAt));
        const orgsById = new Map(orgRows.map((org) => [org.id, org]));

        return Response.json({
          orgs: orgRows.map((org) => ({
            churchTimeZone: org.churchTimeZone ?? null,
            city: org.city ?? null,
            completedOnboarding: Boolean(org.completedOnboarding),
            countryCode: org.countryCode ?? null,
            createdAt: org.createdAt?.getTime(),
            id: org.id,
            latitude: org.latitude ?? null,
            logo: org.logo ?? null,
            longitude: org.longitude ?? null,
            membersCount: memberRows.filter((row) => row.organizationId === org.id).length,
            name: org.name,
            size: org.size ?? null,
            slug: org.slug ?? null,
            state: org.state ?? null,
            street: org.street ?? null,
            teamsCount: teamRows.filter((row) => row.church_id === org.id).length,
            url: org.url ?? null,
            zip: org.zip ?? null,
          })),
          users: userRows.map((row) => ({
            churches: memberRows
              .filter((membership) => membership.userId === row.id)
              .map((membership) => ({
                id: membership.organizationId,
                name: orgsById.get(membership.organizationId)?.name ?? membership.organizationId,
                role: membership.role,
                slug: orgsById.get(membership.organizationId)?.slug ?? null,
              })),
            createdAt: row.createdAt?.getTime(),
            email: row.email,
            id: row.id,
            image: row.image ?? null,
            name: row.name,
            role: row.role ?? undefined,
          })),
        });
      },
    });

  const handleCreateTestSession = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const body = (await request.json()) as {
          churchName?: string;
          email?: string;
          role?: string | null;
          userName?: string;
        };
        const email = body.email?.trim().toLowerCase();
        const name = body.userName?.trim() || "E2E User";
        const churchName = body.churchName?.trim() || "E2E Church";

        if (!email) {
          return Response.json({ error: "Email is required" }, { status: 400 });
        }

        const signUp = await authRuntime.auth.api.signUpEmail({
          asResponse: true,
          body: {
            email,
            name,
            password: `church-task-e2e-${crypto.randomUUID()}`,
          },
        });
        const signUpCookie = signUp.headers.get("set-cookie");

        if (!signUp.ok || !signUpCookie) {
          return Response.json({ error: "Could not create test user session" }, { status: 500 });
        }

        const org = await authRuntime.auth.api.createOrganization({
          body: {
            churchTimeZone: "America/Chicago",
            name: churchName,
            slug: `e2e-${crypto.randomUUID()}`,
          },
          headers: new Headers({ cookie: signUpCookie }),
        });

        if (!org?.id) {
          return Response.json({ error: "Could not create test Church" }, { status: 500 });
        }

        const activeResponse = await authRuntime.auth.api.setActiveOrganization({
          asResponse: true,
          body: { organizationId: org.id },
          headers: new Headers({ cookie: signUpCookie }),
        });
        const activeCookie = activeResponse.headers.get("set-cookie") ?? signUpCookie;

        const completeResponse = await authRuntime.auth.handler(
          new Request("http://127.0.0.1/api/auth/complete-onboarding", {
            body: JSON.stringify({ orgId: org.id }),
            headers: {
              "content-type": "application/json",
              cookie: activeCookie,
              origin: process.env.E2E_SITE_URL ?? process.env.SITE_URL ?? "http://127.0.0.1",
            },
            method: "POST",
          }),
        );
        const sessionCookie = completeResponse.headers.get("set-cookie") ?? activeCookie;

        if (!completeResponse.ok) {
          return Response.json(
            {
              detail: await completeResponse.text(),
              error: "Could not complete test Church onboarding",
            },
            { status: 500 },
          );
        }

        const authSession = await authRuntime.auth.api.getSession({
          headers: new Headers({ cookie: sessionCookie }),
        });

        if (!authSession) {
          return Response.json({ error: "Could not read test session" }, { status: 500 });
        }

        if (body.role === "admin") {
          await db.update(user).set({ role: "admin" }).where(eq(user.id, authSession.user.id));
          await db
            .update(sessionTable)
            .set({ userRole: "admin" })
            .where(eq(sessionTable.id, authSession.session.id));
        }

        return Response.json(
          {
            church: { id: org.id, name: churchName },
            ok: true,
            user: { email, id: authSession.user.id, name },
          },
          { headers: { "set-cookie": sessionCookie } },
        );
      },
    });

  const handlePromoteCurrentUserToAppAdmin = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const authSession = await authRuntime.auth.api.getSession({ headers: request.headers });

        if (!authSession) {
          return Response.json({ error: "Authentication required" }, { status: 401 });
        }

        await db.update(user).set({ role: "admin" }).where(eq(user.id, authSession.user.id));
        await db
          .update(sessionTable)
          .set({ userRole: "admin" })
          .where(eq(sessionTable.id, authSession.session.id));

        return Response.json({ ok: true });
      },
    });

  const handleCreateTestInvitation = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const authSession = await authRuntime.auth.api.getSession({ headers: request.headers });

        if (!authSession) {
          return Response.json({ error: "Authentication required" }, { status: 401 });
        }

        const session = authSession.session as typeof authSession.session & {
          readonly activeOrganizationId?: string | null;
        };
        const organizationId = session.activeOrganizationId;

        if (!organizationId) {
          return Response.json({ error: "Active Church required" }, { status: 400 });
        }

        const body = (await request.json()) as { email?: string; role?: string };
        const email = body.email?.trim().toLowerCase();
        const role = body.role === "admin" ? "admin" : "member";

        if (!email) {
          return Response.json({ error: "Email is required" }, { status: 400 });
        }

        const invitationId = getChurchInvitationId();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await db.insert(invitation).values({
          email,
          expiresAt,
          id: invitationId,
          inviterId: authSession.user.id,
          organizationId,
          role,
          status: "pending",
        });

        return Response.json({ invitation: { _id: invitationId, id: invitationId } });
      },
    });

  const requireAppAdmin = async (request: Request) => {
    const authSession = await authRuntime.auth.api.getSession({ headers: request.headers });

    if (!authSession)
      return { response: Response.json({ error: "Authentication required" }, { status: 401 }) };

    const session = authSession.session as typeof authSession.session & {
      readonly userRole?: string | null;
    };

    if (session.userRole !== "admin") {
      return { response: Response.json({ error: "App administrator required" }, { status: 403 }) };
    }

    return { authSession, response: null };
  };

  const handleUpdateAdminUser = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const admin = await requireAppAdmin(request);
        if (admin.response) return admin.response;

        const body = (await request.json()) as { email?: string; name?: string; userId?: string };
        const userId = body.userId?.trim();
        const name = body.name?.trim();
        const email = body.email?.trim().toLowerCase();

        if (!userId || !name || !email) {
          return Response.json({ error: "User id, name, and email are required" }, { status: 400 });
        }

        await db
          .update(user)
          .set({ email, name, updatedAt: new Date() })
          .where(eq(user.id, userId));

        return Response.json({ ok: true });
      },
    });

  const handleUpdateAdminOrg = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const admin = await requireAppAdmin(request);
        if (admin.response) return admin.response;

        const body = (await request.json()) as {
          churchTimeZone?: string;
          city?: string | null;
          completedOnboarding?: boolean;
          countryCode?: string | null;
          name?: string;
          orgId?: string;
          size?: string | null;
          slug?: string | null;
          state?: string | null;
          street?: string | null;
          url?: string | null;
          zip?: string | null;
        };
        const orgId = body.orgId?.trim();
        const name = body.name?.trim();
        const churchTimeZone = body.churchTimeZone?.trim();

        if (!orgId || !name || !churchTimeZone) {
          return Response.json(
            { error: "Church id, name, and Church Time Zone are required" },
            { status: 400 },
          );
        }

        await db
          .update(organization)
          .set({
            churchTimeZone,
            city: body.city ?? null,
            completedOnboarding: Boolean(body.completedOnboarding),
            countryCode: body.countryCode ?? null,
            name,
            size: body.size ?? null,
            slug: body.slug ?? null,
            state: body.state ?? null,
            street: body.street ?? null,
            updatedAt: new Date(),
            url: body.url ?? null,
            zip: body.zip ?? null,
          })
          .where(eq(organization.id, orgId));

        return Response.json({ ok: true });
      },
    });

  const fetch = async (request: Request) => {
    const url = new URL(request.url);
    const agentResponse = await handleAgentRequest({ auth: authRuntime.auth, db }, request);
    if (agentResponse) return agentResponse;

    const effect = url.pathname.startsWith("/api/auth/")
      ? Effect.promise(() => authRuntime.auth.handler(request))
      : url.pathname === "/api/onboarding/teams" && request.method === "GET"
        ? handleOnboardingTeams(request)
        : url.pathname === "/api/onboarding/workflows" && request.method === "GET"
          ? handleOnboardingWorkflows(request)
          : url.pathname === "/api/onboarding/labels" && request.method === "GET"
            ? handleOnboardingLabels(request)
            : url.pathname === "/api/onboarding/tasks" && request.method === "GET"
              ? handleOnboardingTasks(request)
              : url.pathname === "/api/admin/collections" && request.method === "GET"
                ? handleAdminCollections(request)
                : url.pathname === "/api/test/otp" && request.method === "GET"
                  ? handleTestOtp(request)
                  : url.pathname === "/api/test/app-admin" && request.method === "POST"
                    ? handlePromoteCurrentUserToAppAdmin(request)
                    : url.pathname === "/api/test/bootstrap-active-church" &&
                        request.method === "POST"
                      ? handleBootstrapActiveChurch(request)
                      : url.pathname === "/api/test/team-mutation" && request.method === "POST"
                        ? handleTestTeamMutation(request)
                        : url.pathname === "/api/test/label-mutation" && request.method === "POST"
                          ? handleTestLabelMutation(request)
                          : url.pathname === "/api/test/task-mutation" && request.method === "POST"
                            ? handleTestTaskMutation(request)
                            : url.pathname === "/api/test/session" && request.method === "POST"
                              ? handleCreateTestSession(request)
                              : url.pathname === "/api/test/invitations" &&
                                  request.method === "POST"
                                ? handleCreateTestInvitation(request)
                                : url.pathname === "/api/tracer" && request.method === "GET"
                                  ? handleHealth()
                                  : url.pathname === "/api/tracer/demo-items" &&
                                      request.method === "POST"
                                    ? handleCreateDemoItem(request)
                                    : url.pathname === "/api/admin/users/update" &&
                                        request.method === "POST"
                                      ? handleUpdateAdminUser(request)
                                      : url.pathname === "/api/admin/orgs/update" &&
                                          request.method === "POST"
                                        ? handleUpdateAdminOrg(request)
                                        : url.pathname === "/api/zero/query" &&
                                            request.method === "POST"
                                          ? handleZeroQuery(request)
                                          : url.pathname === "/api/zero/mutate" &&
                                              request.method === "POST"
                                            ? handleZeroMutate(request)
                                            : Effect.succeed(
                                                Response.json(
                                                  { error: "Not found" },
                                                  { status: 404 },
                                                ),
                                              );

    return Effect.runPromise(effect).catch((cause) =>
      Response.json(
        { error: cause instanceof Error ? cause.message : String(cause) },
        { status: 500 },
      ),
    );
  };

  return {
    close: async () => {
      await authRuntime.pool.end();
      await pool.end();
    },
    fetch,
  };
};
