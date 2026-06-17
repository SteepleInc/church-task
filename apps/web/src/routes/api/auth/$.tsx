import { createAuth } from "@church-task/auth";
import { createFileRoute } from "@tanstack/react-router";

const authRuntime = process.env.DATABASE_URL ? createAuth(process.env.DATABASE_URL) : null;

const handleAuthRequest = (request: Request) => {
  if (!authRuntime) {
    return Response.json(
      { error: "DATABASE_URL is required to handle auth requests." },
      { status: 500 },
    );
  }

  return authRuntime.auth.handler(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
