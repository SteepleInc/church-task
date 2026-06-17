import { createFileRoute } from "@tanstack/react-router";

import { handleApiRequest } from "../-runtime";

const handleAuthRequest = (request: Request) => {
  return handleApiRequest(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
