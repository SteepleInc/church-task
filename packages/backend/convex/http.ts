import { httpRouter } from "convex/server";

import { mcpCurrentUserToolResponse } from "../agent/operations";
import { authComponent, createAuth } from "../authCore";
import { api } from "./_generated/api";
import { httpAction, type ActionCtx } from "./_generated/server";
import { polar } from "./polar";

const http = httpRouter();
const convexFunctionRefs = api as any;

const unauthenticatedResponse = () =>
  Response.json(
    {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      },
    },
    { status: 401 },
  );

const metadataHeaders = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: "/.well-known/oauth-authorization-server",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const metadata = await createAuth(ctx).api.getMcpOAuthConfig({
      request,
      asResponse: false,
    });

    return Response.json(metadata, { headers: metadataHeaders });
  }),
});

http.route({
  path: "/.well-known/oauth-protected-resource",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const metadata = await createAuth(ctx).api.getMCPProtectedResource({
      request,
      asResponse: false,
    });

    return Response.json(metadata, { headers: metadataHeaders });
  }),
});

http.route({
  path: "/api/agent/current-user",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    return Response.json({
      ok: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  }),
});

http.route({
  path: "/api/mcp/current-session",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    return Response.json({
      ok: true,
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
      },
    });
  }),
});

http.route({
  path: "/api/mcp/tools/current-user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    return Response.json(
      mcpCurrentUserToolResponse({
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      }),
    );
  }),
});

http.route({
  path: "/api/mcp/tools/update-task",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    const body = (await request.json()) as {
      readonly churchId: string;
      readonly taskId: string;
      readonly title?: string;
      readonly assignedUserId?: string | null;
      readonly teamId?: string | null;
      readonly workflowStatusId?: string;
      readonly dueDate?: string;
      readonly cycleId?: string;
      readonly parentTaskId?: string | null;
    };

    const { churchId, taskId, ...fields } = body;
    const result = await ctx.runMutation(convexFunctionRefs.tasks.mcpUpdateTask, {
      churchId,
      actorUserId: session.user.id,
      taskId,
      fields,
    });

    return Response.json({
      ok: result.ok,
      tool: "update_task",
      result,
    });
  }),
});

http.route({
  path: "/api/mcp/tools/create-task",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    const body = (await request.json()) as {
      readonly churchId: string;
      readonly title: string;
      readonly teamId?: string | null;
      readonly assignedUserId?: string | null;
      readonly workflowStatusId: string;
      readonly dueDate: string;
      readonly parentTaskId?: string | null;
    };

    const result = await ctx.runMutation(convexFunctionRefs.tasks.mcpCreateTask, {
      ...body,
      actorUserId: session.user.id,
    });

    return Response.json({ ok: result.ok, tool: "create_task", result });
  }),
});

http.route({
  path: "/api/mcp/tools/list-tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    const body = (await request.json()) as {
      readonly churchId: string;
      readonly surface?: "my_work" | "our_work";
      readonly cycleId?: string;
      readonly teamId?: string | null;
      readonly assignedUserId?: string | null;
      readonly workflowStatusId?: string;
      readonly taskState?: "todo" | "in_progress" | "done" | "canceled";
    };
    const result = await ctx.runQuery(convexFunctionRefs.tasks.mcpListTasks, {
      ...body,
      actorUserId: session.user.id,
    });

    return Response.json({ ok: result.ok, tool: "list_tasks", result });
  }),
});

http.route({
  path: "/api/mcp/tools/get-task",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const session = await createAuth(ctx).api.getSession({ headers: request.headers });

    if (!session?.user) {
      return unauthenticatedResponse();
    }

    const body = (await request.json()) as { readonly churchId: string; readonly taskId: string };
    const result = await ctx.runQuery(convexFunctionRefs.tasks.mcpListTasks, {
      churchId: body.churchId,
      actorUserId: session.user.id,
      taskId: body.taskId,
    });

    return Response.json({ ok: result.ok, tool: "get_task", result });
  }),
});

const handleMcpLookup = async (
  ctx: ActionCtx,
  request: Request,
  args: { readonly tool: string; readonly query: any; readonly resultKey: string },
) => {
  const session = await createAuth(ctx).api.getSession({ headers: request.headers });

  if (!session?.user) {
    return unauthenticatedResponse();
  }

  const body = (await request.json()) as {
    readonly churchId: string;
    readonly workflowId?: string;
  };
  const result = await ctx.runQuery(args.query, {
    ...body,
    actorUserId: session.user.id,
  });

  return Response.json({
    ok: result.ok,
    tool: args.tool,
    ...(result.error ? { error: result.error } : {}),
    [args.resultKey]: result[args.resultKey] ?? [],
  });
};

http.route({
  path: "/api/mcp/tools/list-users",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpLookup(ctx, request, {
      tool: "list_users",
      query: convexFunctionRefs.tasks.mcpListUsers,
      resultKey: "users",
    }),
  ),
});

http.route({
  path: "/api/mcp/tools/list-teams",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpLookup(ctx, request, {
      tool: "list_teams",
      query: convexFunctionRefs.tasks.mcpListTeams,
      resultKey: "teams",
    }),
  ),
});

http.route({
  path: "/api/mcp/tools/list-cycles",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpLookup(ctx, request, {
      tool: "list_cycles",
      query: convexFunctionRefs.tasks.mcpListCycles,
      resultKey: "cycles",
    }),
  ),
});

http.route({
  path: "/api/mcp/tools/list-workflow-statuses",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpLookup(ctx, request, {
      tool: "list_workflow_statuses",
      query: convexFunctionRefs.tasks.mcpListWorkflowStatuses,
      resultKey: "workflowStatuses",
    }),
  ),
});

const handleMcpTaskTransition = async (
  ctx: ActionCtx,
  request: Request,
  args: {
    readonly tool: "complete_task" | "cancel_task" | "reopen_task";
    readonly mutation: any;
  },
) => {
  const session = await createAuth(ctx).api.getSession({ headers: request.headers });

  if (!session?.user) {
    return unauthenticatedResponse();
  }

  const body = (await request.json()) as {
    readonly churchId: string;
    readonly taskId: string;
  };

  const result = await ctx.runMutation(args.mutation, {
    churchId: body.churchId,
    actorUserId: session.user.id,
    taskId: body.taskId,
  });

  return Response.json({
    ok: result.ok,
    tool: args.tool,
    result,
  });
};

http.route({
  path: "/api/mcp/tools/complete-task",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpTaskTransition(ctx, request, {
      tool: "complete_task",
      mutation: convexFunctionRefs.tasks.mcpCompleteTask,
    }),
  ),
});

http.route({
  path: "/api/mcp/tools/cancel-task",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpTaskTransition(ctx, request, {
      tool: "cancel_task",
      mutation: convexFunctionRefs.tasks.mcpCancelTask,
    }),
  ),
});

http.route({
  path: "/api/mcp/tools/reopen-task",
  method: "POST",
  handler: httpAction((ctx, request) =>
    handleMcpTaskTransition(ctx, request, {
      tool: "reopen_task",
      mutation: convexFunctionRefs.tasks.mcpReopenTask,
    }),
  ),
});

polar.registerRoutes(http);

export default http;
