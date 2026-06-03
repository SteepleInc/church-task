import { Schema } from "effect";

export const CycleTableFieldsSchema = Schema.Struct({
  churchId: Schema.String,
  startDate: Schema.String,
  endDate: Schema.String,
  startsAt: Schema.String,
  endsAt: Schema.String,
  churchTimeZone: Schema.String,
});

export const CycleSchema = Schema.Struct({
  id: Schema.String,
  churchId: Schema.String,
  startDate: Schema.String,
  endDate: Schema.String,
  startsAt: Schema.String,
  endsAt: Schema.String,
  churchTimeZone: Schema.String,
});

export type Cycle = typeof CycleSchema.Type;
