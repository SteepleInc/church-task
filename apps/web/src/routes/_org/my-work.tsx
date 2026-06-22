import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

import { MyWorkSearchSchema } from "@/components/tasks/task-view-options";
import { WorkPage } from "@/routes/-work-page";

export const Route = createFileRoute("/_org/my-work")({
  validateSearch: Schema.toStandardSchemaV1(MyWorkSearchSchema),
  component: RouteComponent,
});

function RouteComponent() {
  return <WorkPage activePanel="my_work" />;
}
