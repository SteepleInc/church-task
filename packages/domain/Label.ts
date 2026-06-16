import { Schema } from "effect";

import { TEAM_COLORS, getTeamColorForName } from "@church-task/domain/Team";

// Label Color uses the same fixed product palette as Team Color
// (see CONTEXT.md "Label Color").
export const LABEL_COLORS = TEAM_COLORS;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const LabelColorSchema = Schema.Literal(...LABEL_COLORS);

export const isLabelColor = (value: unknown): value is LabelColor =>
  typeof value === "string" && (LABEL_COLORS as readonly string[]).includes(value);

// A Label Color is derived from the Label's name when the Label is created,
// same derivation as Team Color.
export const getLabelColorForName = (name: string): LabelColor => getTeamColorForName(name);

export const LabelTableFieldsSchema = Schema.Struct({
  churchId: Schema.String,
  // Null means Church-scoped; a Team id means the Label is a Team Label,
  // applicable only to Tasks assigned to that Team (see CONTEXT.md "Team Label").
  teamId: Schema.Union(Schema.String, Schema.Null),
  name: Schema.String,
  color: LabelColorSchema,
});

// The client-facing Label shape. Beyond the stored table fields it carries
// read-only derived stats used by the Labels settings table (see CONTEXT.md
// "Label"): when the Label was created, how many Tasks currently carry it, and
// when it was last applied to a Task.
export const LabelSchema = Schema.Struct({
  id: Schema.String,
  churchId: Schema.String,
  teamId: Schema.Union(Schema.String, Schema.Null),
  name: Schema.String,
  color: LabelColorSchema,
  // Epoch ms of the Label document's creation (Convex `_creationTime`).
  createdAt: Schema.Number,
  // Number of Tasks in the Church that currently carry this Label.
  taskCount: Schema.Number,
  // ISO timestamp of the most recent time this Label was added to a Task, or
  // null if it has never been applied (derived from the Activity log).
  lastAppliedAt: Schema.Union(Schema.String, Schema.Null),
});

export type Label = typeof LabelSchema.Type;

// Label names are unique case-insensitively within their scope (Church scope,
// or a single Team's scope). Used by create/rename validation.
export const normalizeLabelName = (name: string): string => name.trim().toLowerCase();
