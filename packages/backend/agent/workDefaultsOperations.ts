import { Schema } from "effect";

export const WorkDefaultsChurchArgs = Schema.Struct({
  churchId: Schema.String,
});

export const WorkflowSummary = Schema.Struct({
  id: Schema.String,
  key: Schema.String,
  name: Schema.String,
  isDefault: Schema.Boolean,
  sortOrder: Schema.Number,
  archivedAt: Schema.Union(Schema.String, Schema.Null),
});

export const WorkflowStatusSummary = Schema.Struct({
  id: Schema.String,
  workflowId: Schema.String,
  key: Schema.String,
  name: Schema.String,
  taskState: Schema.Union(
    Schema.Literal("todo"),
    Schema.Literal("in_progress"),
    Schema.Literal("done"),
    Schema.Literal("canceled"),
  ),
  sortOrder: Schema.Number,
  archivedAt: Schema.Union(Schema.String, Schema.Null),
});

export const KeyDateSummary = Schema.Struct({
  id: Schema.String,
  key: Schema.String,
  name: Schema.String,
  schedule: Schema.Union(
    Schema.Struct({
      kind: Schema.Literal("fixedYearly"),
      month: Schema.Number,
      day: Schema.Number,
    }),
    Schema.Struct({
      kind: Schema.Literal("computedYearly"),
      rule: Schema.Union(
        Schema.Literal("easter"),
        Schema.Literal("palm_sunday"),
        Schema.Literal("pentecost"),
        Schema.Literal("mothers_day"),
        Schema.Literal("fathers_day"),
      ),
    }),
  ),
  archivedAt: Schema.Union(Schema.String, Schema.Null),
});

export const WorkDefaultsData = Schema.Struct({
  workflows: Schema.Array(WorkflowSummary),
  workflowStatuses: Schema.Array(WorkflowStatusSummary),
  keyDates: Schema.Array(KeyDateSummary),
});

export const WorkDefaultsResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Union(Schema.Literal("seedWorkDefaults"), Schema.Literal("readWorkDefaults")),
  data: WorkDefaultsData,
});

export type WorkDefaultsData = typeof WorkDefaultsData.Type;
export type WorkDefaultsResponse = typeof WorkDefaultsResponse.Type;

export const workDefaultsResponse = (
  operation: "seedWorkDefaults" | "readWorkDefaults",
  data: WorkDefaultsData,
): WorkDefaultsResponse => ({
  ok: true,
  operation,
  data,
});
