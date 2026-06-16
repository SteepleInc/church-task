import { Schema } from "effect";

import {
  ActivityActorType,
  ActivityEntityType,
  ActivityEventType,
  ActivityMetadata,
} from "../activityRegistry";

export const RecordActivityArgs = Schema.Struct({
  churchId: Schema.String,
  entityType: ActivityEntityType,
  entityId: Schema.String,
  eventType: ActivityEventType,
  actorType: ActivityActorType,
  actorId: Schema.Union(Schema.String, Schema.Null),
  occurredAt: Schema.String,
  cycleId: Schema.Union(Schema.String, Schema.Null),
  metadata: Schema.Unknown,
});

export const ListActivitiesForEntityArgs = Schema.Struct({
  churchId: Schema.String,
  entityType: ActivityEntityType,
  entityId: Schema.String,
});

export const ActivitySummary = Schema.Struct({
  id: Schema.String,
  churchId: Schema.String,
  entityType: ActivityEntityType,
  entityId: Schema.String,
  eventType: ActivityEventType,
  actorType: ActivityActorType,
  actorId: Schema.Union(Schema.String, Schema.Null),
  occurredAt: Schema.String,
  cycleId: Schema.Union(Schema.String, Schema.Null),
  metadata: ActivityMetadata,
});

export const RecordActivityResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Literal("recordActivity"),
  data: Schema.Struct({ activity: ActivitySummary }),
});

export const ActivityErrorResponse = Schema.Struct({
  ok: Schema.Literal(false),
  operation: Schema.Literal("recordActivity"),
  error: Schema.Struct({
    code: Schema.Literal("invalid_activity_metadata"),
    message: Schema.String,
  }),
});

export const RecordActivityOperationResponse = Schema.Union(
  RecordActivityResponse,
  ActivityErrorResponse,
);

export const ListActivitiesForEntityResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Literal("listActivitiesForEntity"),
  data: Schema.Struct({ activities: Schema.Array(ActivitySummary) }),
});

export type ActivitySummary = typeof ActivitySummary.Type;
export type RecordActivityResponse = typeof RecordActivityResponse.Type;
export type RecordActivityOperationResponse = typeof RecordActivityOperationResponse.Type;
export type ListActivitiesForEntityResponse = typeof ListActivitiesForEntityResponse.Type;

export const recordActivityResponse = (activity: ActivitySummary): RecordActivityResponse => ({
  ok: true,
  operation: "recordActivity",
  data: { activity },
});

export const invalidActivityMetadataResponse = (): RecordActivityOperationResponse => ({
  ok: false,
  operation: "recordActivity",
  error: {
    code: "invalid_activity_metadata",
    message: "Activity metadata does not match the registered event schema.",
  },
});

export const listActivitiesForEntityResponse = (
  activities: ReadonlyArray<ActivitySummary>,
): ListActivitiesForEntityResponse => ({
  ok: true,
  operation: "listActivitiesForEntity",
  data: { activities },
});
