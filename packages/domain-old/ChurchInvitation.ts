import { Schema } from "effect";

export const ChurchInvitationStatusSchema = Schema.Literal(
  "pending",
  "accepted",
  "rejected",
  "canceled",
);

export const ChurchInvitationSchema = Schema.Struct({
  id: Schema.String,
  orgId: Schema.String,
  email: Schema.String,
  role: Schema.String,
  status: ChurchInvitationStatusSchema,
  teamId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  inviterUserId: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  expiresAt: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
});

export type ChurchInvitation = typeof ChurchInvitationSchema.Type;
export type ChurchInvitationStatus = typeof ChurchInvitationStatusSchema.Type;
