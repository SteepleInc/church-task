import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

import { ChurchWorkSearchSchema } from "@/components/tasks/task-view-options";
import { WorkPage } from "@/routes/-work-page";

export const Route = createFileRoute("/_org/our-work")({
  validateSearch: Schema.toStandardSchemaV1(ChurchWorkSearchSchema),
  component: RouteComponent,
});

function RouteComponent() {
  return <WorkPage activePanel="our_work" />;
}
