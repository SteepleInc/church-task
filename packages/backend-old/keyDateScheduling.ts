import type { GenericDatabaseReader, GenericMutationCtx } from "convex/server";

import type { DataModel, Id } from "./convex/_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;
type ReaderCtx = { readonly db: GenericDatabaseReader<DataModel> };

export type KeyDateSchedule =
  | { readonly kind: "fixedYearly"; readonly month: number; readonly day: number }
  | {
      readonly kind: "computedYearly";
      readonly rule: "easter" | "palm_sunday" | "pentecost" | "mothers_day" | "fathers_day";
    }
  | { readonly kind: "manualOccurrences" }
  | { readonly kind: "oneTime" };

type KeyDateInput = {
  readonly key: string;
  readonly name: string;
  readonly schedule: KeyDateSchedule;
};

type OccurrenceInput = {
  readonly keyDateId: string;
  readonly localDate: string;
  readonly label: string | null;
};

type ResolvedOccurrence = {
  readonly id: Id<"keyDateOccurrences"> | null;
  readonly keyDateId: Id<"keyDates">;
  readonly key: string;
  readonly name: string;
  readonly localDate: string;
  readonly label: string | null;
  readonly source: KeyDateSchedule["kind"];
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function formatLocalDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function parseLocalDate(localDate: string) {
  if (!isoDatePattern.test(localDate)) {
    throw new Error("Local date must use YYYY-MM-DD format.");
  }

  const [year, month, day] = localDate.split("-").map(Number) as [number, number, number];
  const asUtcDate = new Date(Date.UTC(year, month - 1, day));
  if (asUtcDate.toISOString().slice(0, 10) !== localDate) {
    throw new Error("Local date must be a real calendar date.");
  }

  return { year, month, day };
}

function addDays(localDate: string, days: number) {
  const { year, month, day } = parseLocalDate(localDate);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function nthWeekdayOfMonth(args: {
  readonly year: number;
  readonly month: number;
  readonly weekday: number;
  readonly nth: number;
}) {
  const firstDay = new Date(Date.UTC(args.year, args.month - 1, 1)).getUTCDay();
  const day = 1 + ((args.weekday - firstDay + 7) % 7) + (args.nth - 1) * 7;
  return formatLocalDate(args.year, args.month, day);
}

function easterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return formatLocalDate(year, month, day);
}

export function resolveComputedKeyDate(
  rule: Extract<KeyDateSchedule, { kind: "computedYearly" }>["rule"],
  year: number,
) {
  if (rule === "easter") return easterDate(year);
  if (rule === "palm_sunday") return addDays(easterDate(year), -7);
  if (rule === "pentecost") return addDays(easterDate(year), 49);
  if (rule === "mothers_day") return nthWeekdayOfMonth({ year, month: 5, weekday: 0, nth: 2 });
  return nthWeekdayOfMonth({ year, month: 6, weekday: 0, nth: 3 });
}

function resolveScheduleForYear(schedule: KeyDateSchedule, year: number) {
  if (schedule.kind === "fixedYearly") {
    return formatLocalDate(year, schedule.month, schedule.day);
  }
  if (schedule.kind === "computedYearly") {
    return resolveComputedKeyDate(schedule.rule, year);
  }
  return null;
}

function assertValidSchedule(schedule: KeyDateSchedule) {
  if (schedule.kind === "fixedYearly") {
    parseLocalDate(formatLocalDate(2024, schedule.month, schedule.day));
  }
}

export async function createKeyDates(
  ctx: MutationCtx,
  args: { readonly churchId: string; readonly keyDates: ReadonlyArray<KeyDateInput> },
) {
  const createdKeyDateIds: Array<Id<"keyDates">> = [];

  for (const keyDate of args.keyDates) {
    assertValidSchedule(keyDate.schedule);
    const existing = await ctx.db
      .query("keyDates")
      .withIndex("by_churchId_and_key", (q) =>
        q.eq("churchId", args.churchId).eq("key", keyDate.key),
      )
      .unique();

    if (existing) return { ok: false as const, code: "duplicateKey" };
  }

  for (const keyDate of args.keyDates) {
    const keyDateId = await ctx.db.insert("keyDates", {
      churchId: args.churchId,
      key: keyDate.key,
      name: keyDate.name,
      schedule: keyDate.schedule,
      archivedAt: null,
    });
    createdKeyDateIds.push(keyDateId);
  }

  return { ok: true as const, createdKeyDateIds };
}

export async function createKeyDateOccurrences(
  ctx: MutationCtx,
  args: { readonly churchId: string; readonly occurrences: ReadonlyArray<OccurrenceInput> },
) {
  const createdOccurrenceIds: Array<Id<"keyDateOccurrences">> = [];

  for (const occurrence of args.occurrences) {
    parseLocalDate(occurrence.localDate);
    const keyDate = await ctx.db.get(occurrence.keyDateId as Id<"keyDates">);
    if (!keyDate || keyDate.churchId !== args.churchId || keyDate.archivedAt !== null) {
      return { ok: false as const, code: "keyDateNotFound" };
    }

    const existing = await ctx.db
      .query("keyDateOccurrences")
      .withIndex("by_keyDateId_and_localDate", (q) =>
        q.eq("keyDateId", keyDate._id).eq("localDate", occurrence.localDate),
      )
      .unique();
    if (existing) return { ok: false as const, code: "duplicateOccurrence" };
  }

  for (const occurrence of args.occurrences) {
    const occurrenceId = await ctx.db.insert("keyDateOccurrences", {
      churchId: args.churchId,
      keyDateId: occurrence.keyDateId,
      localDate: occurrence.localDate,
      label: occurrence.label,
      archivedAt: null,
    });
    createdOccurrenceIds.push(occurrenceId);
  }

  return { ok: true as const, createdOccurrenceIds };
}

export async function readKeyDateModel(ctx: ReaderCtx, churchId: string) {
  const keyDates = await ctx.db
    .query("keyDates")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();
  const occurrences = await ctx.db
    .query("keyDateOccurrences")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();

  return { keyDates, occurrences };
}

export async function resolveKeyDateOccurrences(
  ctx: ReaderCtx,
  args: { readonly churchId: string; readonly fromYear: number; readonly toYear: number },
) {
  const model = await readKeyDateModel(ctx, args.churchId);
  const resolved: Array<ResolvedOccurrence> = [];

  for (const keyDate of model.keyDates) {
    if (keyDate.archivedAt !== null) continue;

    for (let year = args.fromYear; year <= args.toYear; year += 1) {
      const localDate = resolveScheduleForYear(keyDate.schedule, year);
      if (localDate) {
        resolved.push({
          id: null,
          keyDateId: keyDate._id,
          key: keyDate.key,
          name: keyDate.name,
          localDate,
          label: null,
          source: keyDate.schedule.kind,
        });
      }
    }
  }

  for (const occurrence of model.occurrences) {
    if (occurrence.archivedAt !== null) continue;
    const { year } = parseLocalDate(occurrence.localDate);
    if (year < args.fromYear || year > args.toYear) continue;
    const keyDate = model.keyDates.find((candidate) => candidate._id === occurrence.keyDateId);
    if (!keyDate || keyDate.archivedAt !== null) continue;

    resolved.push({
      id: occurrence._id,
      keyDateId: keyDate._id,
      key: keyDate.key,
      name: keyDate.name,
      localDate: occurrence.localDate,
      label: occurrence.label,
      source: keyDate.schedule.kind === "oneTime" ? "oneTime" : "manualOccurrences",
    });
  }

  return resolved.sort((left, right) =>
    left.localDate === right.localDate
      ? left.name.localeCompare(right.name)
      : left.localDate.localeCompare(right.localDate),
  );
}
