import {
  getLabelColorForName,
  normalizeLabelName,
  type LabelColor,
} from "@church-task/domain-old/Label";
import type { GenericDatabaseReader, GenericMutationCtx } from "convex/server";

import type { DataModel, Id } from "./convex/_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;
type ReaderCtx = { readonly db: GenericDatabaseReader<DataModel> };

export type LabelDoc = DataModel["labels"]["document"];

// Starter Labels seeded for every Church (see CONTEXT.md "Starter Labels").
export const STARTER_LABELS = [
  "Worship",
  "Kids & Youth",
  "Outreach",
  "Events",
  "Facilities",
  "Communications",
  "Admin",
] as const;

export async function listLabelsForChurch(ctx: ReaderCtx, churchId: string) {
  const labels = await ctx.db
    .query("labels")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();

  // Labels are presented alphabetically everywhere; there is no sortOrder.
  return [...labels].sort((left, right) => left.name.localeCompare(right.name));
}

export const serializeLabel = (label: LabelDoc) => ({
  id: label._id,
  churchId: label.churchId,
  teamId: label.teamId,
  name: label.name,
  color: label.color,
});

export type LabelStats = {
  readonly taskCount: number;
  readonly lastAppliedAt: string | null;
};

/**
 * The client-facing Label shape: the stored fields plus the read-only derived
 * stats the Labels settings table renders (creation time, current Task usage
 * count, and the most recent time the Label was applied to a Task).
 */
export const serializeLabelWithStats = (label: LabelDoc, stats: LabelStats) => ({
  ...serializeLabel(label),
  createdAt: label._creationTime,
  taskCount: stats.taskCount,
  lastAppliedAt: stats.lastAppliedAt,
});

/**
 * Computes per-Label stats for a Church in a single pass. Reads the Church's
 * Tasks (for current usage counts) and its `task.labels_changed` Activities (for
 * "last applied") through the same bounded `by_churchId` scans used elsewhere,
 * so adding stats does not change the read-cost profile of label reads.
 *
 * "Last applied" is the most recent Activity in which the Label id was newly
 * added to a Task (present in `labelIds` but not `previousLabelIds`), which is
 * id-based and survives renames.
 */
export async function computeLabelStatsForChurch(
  ctx: ReaderCtx,
  churchId: string,
): Promise<ReadonlyMap<string, LabelStats>> {
  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();

  const taskCounts = new Map<string, number>();
  for (const task of tasks) {
    for (const labelId of task.labelIds ?? []) {
      taskCounts.set(labelId, (taskCounts.get(labelId) ?? 0) + 1);
    }
  }

  const activities = await ctx.db
    .query("activities")
    .withIndex("by_churchId", (q) => q.eq("churchId", churchId))
    .collect();

  const lastAppliedById = new Map<string, string>();
  for (const activity of activities) {
    if (activity.eventType !== "task.labels_changed") continue;
    const metadata = activity.metadata as {
      readonly previousLabelIds?: ReadonlyArray<string>;
      readonly labelIds?: ReadonlyArray<string>;
    };
    const previous = new Set(metadata.previousLabelIds ?? []);
    for (const labelId of metadata.labelIds ?? []) {
      if (previous.has(labelId)) continue;
      const current = lastAppliedById.get(labelId);
      if (!current || activity.occurredAt > current) {
        lastAppliedById.set(labelId, activity.occurredAt);
      }
    }
  }

  const labelIds = new Set<string>([...taskCounts.keys(), ...lastAppliedById.keys()]);
  const stats = new Map<string, LabelStats>();
  for (const labelId of labelIds) {
    stats.set(labelId, {
      taskCount: taskCounts.get(labelId) ?? 0,
      lastAppliedAt: lastAppliedById.get(labelId) ?? null,
    });
  }
  return stats;
}

const EMPTY_LABEL_STATS: LabelStats = { taskCount: 0, lastAppliedAt: null };

/**
 * Loads the Church's Labels and returns them in the client-facing shape,
 * enriched with derived stats. Used by every read path that surfaces Labels to
 * the UI (the Labels list and the work-defaults read).
 */
export async function listSerializedLabelsForChurch(ctx: ReaderCtx, churchId: string) {
  const labels = await listLabelsForChurch(ctx, churchId);
  const statsById = await computeLabelStatsForChurch(ctx, churchId);

  return labels.map((label) =>
    serializeLabelWithStats(label, statsById.get(label._id) ?? EMPTY_LABEL_STATS),
  );
}

// Label names are unique case-insensitively within their scope: one scope per
// Church (teamId null) plus one per Team. A Team Label may shadow a
// Church-scoped name.
const hasDuplicateName = (
  labels: ReadonlyArray<LabelDoc>,
  args: { readonly name: string; readonly teamId: string | null; readonly excludeId?: string },
) => {
  const normalized = normalizeLabelName(args.name);
  return labels.some(
    (label) =>
      label._id !== args.excludeId &&
      label.teamId === args.teamId &&
      normalizeLabelName(label.name) === normalized,
  );
};

export async function createLabelForChurch(
  ctx: MutationCtx,
  args: {
    readonly churchId: string;
    readonly name: string;
    readonly teamId: string | null;
    readonly color?: LabelColor;
  },
) {
  const name = args.name.trim();
  if (name === "") return { ok: false as const, code: "invalidLabelName" as const };

  const labels = await listLabelsForChurch(ctx, args.churchId);
  if (hasDuplicateName(labels, { name, teamId: args.teamId })) {
    return { ok: false as const, code: "duplicateLabelName" as const };
  }

  const labelId = await ctx.db.insert("labels", {
    churchId: args.churchId,
    teamId: args.teamId,
    name,
    color: args.color ?? getLabelColorForName(name),
  });

  return { ok: true as const, labelId };
}

export async function updateLabelForChurch(
  ctx: MutationCtx,
  args: {
    readonly churchId: string;
    readonly labelId: string;
    readonly name?: string;
    readonly color?: LabelColor;
  },
) {
  const label = await ctx.db.get(args.labelId as Id<"labels">);
  if (!label || label.churchId !== args.churchId) {
    return { ok: false as const, code: "labelNotFound" as const };
  }

  const patch: Partial<LabelDoc> = {};

  if (args.name !== undefined) {
    const name = args.name.trim();
    if (name === "") return { ok: false as const, code: "invalidLabelName" as const };

    const labels = await listLabelsForChurch(ctx, args.churchId);
    if (hasDuplicateName(labels, { name, teamId: label.teamId, excludeId: label._id })) {
      return { ok: false as const, code: "duplicateLabelName" as const };
    }
    patch.name = name;
  }

  if (args.color !== undefined) patch.color = args.color;

  if (Object.keys(patch).length > 0) await ctx.db.patch(label._id, patch);

  return { ok: true as const, labelId: label._id };
}

/**
 * Hard delete, Linear-style: removes the Label document and strips its id from
 * every Task carrying it, so label counts in the UI never go stale (see ADR
 * 0013). The strip reads the Church's tasks through the same bounded
 * `by_churchId` scan every task read already performs.
 */
export async function deleteLabelForChurch(
  ctx: MutationCtx,
  args: { readonly churchId: string; readonly labelId: string },
) {
  const label = await ctx.db.get(args.labelId as Id<"labels">);
  if (!label || label.churchId !== args.churchId) {
    return { ok: false as const, code: "labelNotFound" as const };
  }

  const tasks = await ctx.db
    .query("tasks")
    .withIndex("by_churchId", (q) => q.eq("churchId", args.churchId))
    .collect();

  for (const task of tasks) {
    const labelIds = task.labelIds ?? [];
    if (!labelIds.includes(label._id)) continue;
    await ctx.db.patch(task._id, { labelIds: labelIds.filter((id) => id !== label._id) });
  }

  await ctx.db.delete(label._id);

  return { ok: true as const, name: label.name };
}

/**
 * Validates a Task's requested label ids against the Church's Labels and the
 * Task's effective Team: every id must exist in the Church, and Team Labels
 * must belong to the Task's Team. Enforced server-side only so human and
 * agent callers behave identically (ADR 0013).
 */
export const validateTaskLabelIds = (
  labelsById: ReadonlyMap<string, LabelDoc>,
  args: { readonly labelIds: ReadonlyArray<string>; readonly teamId: string | null },
) => {
  for (const labelId of args.labelIds) {
    const label = labelsById.get(labelId);
    if (!label) return { ok: false as const, code: "labelNotFound" as const };
    if (label.teamId !== null && label.teamId !== args.teamId) {
      return { ok: false as const, code: "labelNotInTeamScope" as const };
    }
  }

  return { ok: true as const };
};

export const labelsById = (labels: ReadonlyArray<LabelDoc>): ReadonlyMap<string, LabelDoc> =>
  new Map(labels.map((label) => [label._id as string, label]));

export const dedupeLabelIds = (labelIds: ReadonlyArray<string>): Array<string> => [
  ...new Set(labelIds),
];

/**
 * When a Task changes Teams, Team Labels foreign to the destination Team are
 * removed; Church-scoped Labels always survive (see CONTEXT.md "Team Label").
 * Unknown (dangling) ids are dropped as a lazy scrub.
 */
export const stripForeignTeamLabelIds = (
  labelsById: ReadonlyMap<string, LabelDoc>,
  args: { readonly labelIds: ReadonlyArray<string>; readonly teamId: string | null },
): Array<string> =>
  args.labelIds.filter((labelId) => {
    const label = labelsById.get(labelId);
    return label !== undefined && (label.teamId === null || label.teamId === args.teamId);
  });

export const labelNamesForIds = (
  labelsById: ReadonlyMap<string, LabelDoc>,
  labelIds: ReadonlyArray<string>,
): Array<string> =>
  labelIds
    .map((labelId) => labelsById.get(labelId)?.name)
    .filter((name): name is string => name !== undefined);
