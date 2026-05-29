import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "../authCore";
import { httpAction } from "./_generated/server";
import { polar } from "./polar";

const http = httpRouter();

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

polar.registerRoutes(http);

export default http;
