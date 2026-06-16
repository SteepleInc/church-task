import { Schema } from "effect";

export const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  image: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
});

export type User = typeof UserSchema.Type;
