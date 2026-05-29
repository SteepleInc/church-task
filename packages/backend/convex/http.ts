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

authComponent.registerRoutes(http, createAuth, { cors: true });

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

polar.registerRoutes(http);

export default http;
