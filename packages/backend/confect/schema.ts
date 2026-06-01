import { DatabaseSchema, Table } from "@confect/server";
import { Schema } from "effect";

import {
  ActivityActorType,
  ActivityEntityType,
  ActivityEventType,
  ActivityMetadata,
} from "../activityRegistry";

export const Workflows = Table.make(
  "workflows",
  Schema.Struct({
    churchId: Schema.String,
    key: Schema.String,
    name: Schema.String,
    isDefault: Schema.Boolean,
    sortOrder: Schema.Number,
    archivedAt: Schema.Union(Schema.String, Schema.Null),
  }),
)
  .index("by_churchId_and_key", ["churchId", "key"])
  .index("by_churchId", ["churchId"]);

export const WorkflowStatuses = Table.make(
  "workflowStatuses",
  Schema.Struct({
    churchId: Schema.String,
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
  }),
)
  .index("by_workflowId_and_key", ["workflowId", "key"])
  .index("by_churchId", ["churchId"])
  .index("by_workflowId", ["workflowId"]);

export const Tasks = Table.make(
  "tasks",
  Schema.Struct({
    churchId: Schema.String,
    title: Schema.String,
    teamId: Schema.Union(Schema.String, Schema.Null),
    cycleId: Schema.String,
    dueDate: Schema.String,
    parentTaskId: Schema.Union(Schema.String, Schema.Null),
    workflowId: Schema.String,
    workflowStatusId: Schema.String,
    taskState: Schema.Union(
      Schema.Literal("todo"),
      Schema.Literal("in_progress"),
      Schema.Literal("done"),
      Schema.Literal("canceled"),
    ),
  }),
)
  .index("by_churchId", ["churchId"])
  .index("by_churchId_and_cycleId", ["churchId", "cycleId"])
  .index("by_parentTaskId", ["parentTaskId"])
  .index("by_workflowStatusId", ["workflowStatusId"]);

export const Cycles = Table.make(
  "cycles",
  Schema.Struct({
    churchId: Schema.String,
    /** Church-local Monday that identifies the Cycle. */
    startDate: Schema.String,
    /** Church-local Sunday displayed as the Cycle's final calendar date. */
    endDate: Schema.String,
    /** UTC instant for the inclusive start boundary of the local Cycle. */
    startsAt: Schema.String,
    /** UTC instant for the exclusive end boundary immediately after local Sunday. */
    endsAt: Schema.String,
    churchTimeZone: Schema.String,
  }),
)
  .index("by_churchId_and_startDate", ["churchId", "startDate"])
  .index("by_churchId", ["churchId"]);

export const KeyDates = Table.make(
  "keyDates",
  Schema.Struct({
    churchId: Schema.String,
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
  }),
)
  .index("by_churchId_and_key", ["churchId", "key"])
  .index("by_churchId", ["churchId"]);

export const Activities = Table.make(
  "activities",
  Schema.Struct({
    churchId: Schema.String,
    entityType: ActivityEntityType,
    entityId: Schema.String,
    eventType: ActivityEventType,
    actorType: ActivityActorType,
    actorId: Schema.Union(Schema.String, Schema.Null),
    occurredAt: Schema.String,
    cycleId: Schema.Union(Schema.String, Schema.Null),
    metadata: ActivityMetadata,
  }),
)
  .index("by_churchId_and_entity", ["churchId", "entityType", "entityId"])
  .index("by_churchId", ["churchId"]);

export default DatabaseSchema.make()
  .addTable(Workflows)
  .addTable(WorkflowStatuses)
  .addTable(Tasks)
  .addTable(Cycles)
  .addTable(KeyDates)
  .addTable(Activities);
