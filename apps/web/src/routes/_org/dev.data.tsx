import { createFileRoute } from "@tanstack/react-router";

import { DevDataPanel } from "@/routes/-internal-admin";

export const Route = createFileRoute("/_org/dev/data")({
  component: DevDataPanel,
});
