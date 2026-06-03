import { createFileRoute } from "@tanstack/react-router";

import { DevSessionPanel } from "@/routes/-internal-admin";

export const Route = createFileRoute("/_org/dev/session")({
  component: DevSessionPanel,
});
