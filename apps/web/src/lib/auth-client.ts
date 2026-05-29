import { env } from "@church-task/env/web";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.VITE_CONVEX_SITE_URL,
  plugins: [organizationClient({ teams: { enabled: false } }), convexClient(), crossDomainClient()],
});
