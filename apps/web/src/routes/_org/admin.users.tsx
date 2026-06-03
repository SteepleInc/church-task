import { createFileRoute } from "@tanstack/react-router";

import { AppAdminUsersPanel } from "@/routes/-internal-admin";

export const Route = createFileRoute("/_org/admin/users")({
  component: AppAdminUsersPanel,
});
