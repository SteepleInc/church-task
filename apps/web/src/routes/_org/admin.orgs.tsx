import { createFileRoute } from "@tanstack/react-router";

import { AppAdminChurchesPanel } from "@/routes/-internal-admin";

export const Route = createFileRoute("/_org/admin/orgs")({
  component: AppAdminChurchesPanel,
});
