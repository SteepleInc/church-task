import { createTracerApi } from "@church-task/server";
import { createFileRoute } from "@tanstack/react-router";

const tracerApi = process.env.DATABASE_URL ? createTracerApi(process.env.DATABASE_URL) : null;

const handleApiRequest = (request: Request) => {
  if (!tracerApi) {
    return Response.json(
      { error: "DATABASE_URL is required to handle API requests." },
      { status: 500 },
    );
  }

  return tracerApi.fetch(request);
};

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      DELETE: ({ request }) => handleApiRequest(request),
      GET: ({ request }) => handleApiRequest(request),
      OPTIONS: ({ request }) => handleApiRequest(request),
      PATCH: ({ request }) => handleApiRequest(request),
      POST: ({ request }) => handleApiRequest(request),
      PUT: ({ request }) => handleApiRequest(request),
    },
  },
});
