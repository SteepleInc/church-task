import { createFileRoute, retainSearchParams } from "@tanstack/react-router";
import { Schema } from "effect";

import { ChurchWorkSearchSchema } from "@/components/tasks/task-view-options";
import { WorkPage } from "@/routes/-work-page";

export const Route = createFileRoute("/_org/team/$teamIdentifier")({
  validateSearch: Schema.toStandardSchemaV1(ChurchWorkSearchSchema),
  search: {
    // View Tabs and View Options survive switching between Teams, but are not
    // carried across to the other task surfaces (see -work-page-utils).
    middlewares: [retainSearchParams(["tab", "view"])],
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { teamIdentifier } = Route.useParams();

  return <WorkPage activePanel={{ kind: "team", teamIdentifier }} />;
}
