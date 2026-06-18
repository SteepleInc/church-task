import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { Schema } from "effect";

import { ChurchWorkSearchSchema } from "@/components/tasks/task-view-options";
import { DashboardPage } from "@/routes/-dashboard";

export const Route = createFileRoute("/_org/team/$teamIdentifier/weeks/$cycleId")({
  validateSearch: Schema.toStandardSchemaV1(ChurchWorkSearchSchema),
  search: {
    middlewares: [retainSearchParams(["tab", "view", "insights"])],
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { teamIdentifier, cycleId } = Route.useParams();

  return <DashboardPage activePanel={{ kind: "team", teamIdentifier, weekCycleId: cycleId }} />;
}
