import { Schema } from "effect";

export const OrgSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  churchTimeZone: Schema.String,
  completedOnboarding: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  url: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  street: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  city: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  state: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  zip: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  countryCode: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
  latitude: Schema.optional(Schema.Union(Schema.Number, Schema.Null)),
  longitude: Schema.optional(Schema.Union(Schema.Number, Schema.Null)),
  size: Schema.optional(Schema.Union(Schema.String, Schema.Null)),
});

export type Org = typeof OrgSchema.Type;
