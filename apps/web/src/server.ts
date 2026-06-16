import { createTracerApi } from "@church-task/server";
import handler from "@tanstack/react-start/server-entry";

const tracerApi = process.env.DATABASE_URL ? createTracerApi(process.env.DATABASE_URL) : null;

export default async function fetch(request: Request) {
  const url = new URL(request.url);

  if (tracerApi && url.pathname.startsWith("/api/")) {
    return tracerApi.fetch(request);
  }

  return handler.fetch(request);
}
