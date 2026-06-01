import { Schema } from "effect";

export const KeyDateSchedule = Schema.Union(
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
  Schema.Struct({ kind: Schema.Literal("manualOccurrences") }),
  Schema.Struct({ kind: Schema.Literal("oneTime") }),
);

export const KeyDateCreateArgs = Schema.Struct({
  churchId: Schema.String,
  keyDates: Schema.Array(
    Schema.Struct({
      key: Schema.String,
      name: Schema.String,
      schedule: KeyDateSchedule,
    }),
  ),
});

export const KeyDateOccurrenceCreateArgs = Schema.Struct({
  churchId: Schema.String,
  occurrences: Schema.Array(
    Schema.Struct({
      keyDateId: Schema.String,
      localDate: Schema.String,
      label: Schema.Union(Schema.String, Schema.Null),
    }),
  ),
});

export const KeyDateListArgs = Schema.Struct({
  churchId: Schema.String,
});

export const KeyDateResolveOccurrencesArgs = Schema.Struct({
  churchId: Schema.String,
  fromYear: Schema.Number,
  toYear: Schema.Number,
});

const KeyDateSummary = Schema.Struct({
  id: Schema.String,
  key: Schema.String,
  name: Schema.String,
  schedule: KeyDateSchedule,
  archivedAt: Schema.Union(Schema.String, Schema.Null),
});

const KeyDateOccurrenceSummary = Schema.Struct({
  id: Schema.String,
  keyDateId: Schema.String,
  localDate: Schema.String,
  label: Schema.Union(Schema.String, Schema.Null),
  archivedAt: Schema.Union(Schema.String, Schema.Null),
});

const ResolvedKeyDateOccurrence = Schema.Struct({
  id: Schema.Union(Schema.String, Schema.Null),
  keyDateId: Schema.String,
  key: Schema.String,
  name: Schema.String,
  localDate: Schema.String,
  label: Schema.Union(Schema.String, Schema.Null),
  source: Schema.Union(
    Schema.Literal("fixedYearly"),
    Schema.Literal("computedYearly"),
    Schema.Literal("manualOccurrences"),
    Schema.Literal("oneTime"),
  ),
});

export const KeyDateSuccessResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Union(
    Schema.Literal("createKeyDates"),
    Schema.Literal("createKeyDateOccurrences"),
    Schema.Literal("listKeyDates"),
    Schema.Literal("resolveKeyDateOccurrences"),
  ),
  data: Schema.Struct({
    keyDates: Schema.Array(KeyDateSummary),
    occurrences: Schema.Array(KeyDateOccurrenceSummary),
    resolvedOccurrences: Schema.Array(ResolvedKeyDateOccurrence),
  }),
});

export const KeyDateErrorResponse = Schema.Struct({
  ok: Schema.Literal(false),
  operation: Schema.Union(
    Schema.Literal("createKeyDates"),
    Schema.Literal("createKeyDateOccurrences"),
    Schema.Literal("listKeyDates"),
    Schema.Literal("resolveKeyDateOccurrences"),
  ),
  error: Schema.Struct({
    code: Schema.Union(
      Schema.Literal("not_authenticated"),
      Schema.Literal("not_church_member"),
      Schema.Literal("not_authorized"),
      Schema.Literal("duplicate_key_date"),
      Schema.Literal("duplicate_occurrence"),
      Schema.Literal("key_date_not_found"),
      Schema.Literal("invalid_key_date"),
    ),
    message: Schema.String,
  }),
});

export const KeyDateWriteResponse = Schema.Union(KeyDateSuccessResponse, KeyDateErrorResponse);
export const KeyDateReadResponse = Schema.Union(KeyDateSuccessResponse, KeyDateErrorResponse);

export type KeyDateOperation = Schema.Schema.Type<typeof KeyDateSuccessResponse>["operation"];
export type KeyDateErrorCode = Schema.Schema.Type<typeof KeyDateErrorResponse>["error"]["code"];
export type KeyDateData = Schema.Schema.Type<typeof KeyDateSuccessResponse>["data"];

export const keyDateResponse = (operation: KeyDateOperation, data: KeyDateData) => ({
  ok: true as const,
  operation,
  data,
});

export const keyDateErrorResponse = (
  operation: KeyDateOperation,
  code: KeyDateErrorCode,
  message: string,
) => ({
  ok: false as const,
  operation,
  error: { code, message },
});
