import { Schema } from "effect";

export const TeamProductFieldsSchema = Schema.Struct({
  archivedAt: Schema.Union(Schema.String, Schema.Null),
  sortOrder: Schema.Number,
  defaultWorkflowId: Schema.Union(Schema.String, Schema.Null),
});

export const TeamTableFieldsSchema = Schema.Struct({
  churchId: Schema.String,
  name: Schema.String,
  archivedAt: Schema.Union(Schema.String, Schema.Null),
  sortOrder: Schema.Number,
  defaultWorkflowId: Schema.Union(Schema.String, Schema.Null),
});

export const TeamSchema = Schema.Struct({
  id: Schema.String,
  churchId: Schema.String,
  name: Schema.String,
  archivedAt: Schema.Union(Schema.String, Schema.Null),
  sortOrder: Schema.Number,
  defaultWorkflowId: Schema.Union(Schema.String, Schema.Null),
});

export const TeamMembershipSchema = Schema.Struct({
  id: Schema.String,
  churchId: Schema.String,
  teamId: Schema.String,
  userId: Schema.String,
});

export type Team = typeof TeamSchema.Type;
export type TeamMembership = typeof TeamMembershipSchema.Type;
