import registeredFunctions from "../confect/_generated/registeredFunctions";
import { writeActivity } from "../activityRegistry";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const recordForChurch = registeredFunctions.activities.recordForChurch;
export const listForEntity = registeredFunctions.activities.listForEntity;

export const internalRecordAuthHookActivity = internalMutation({
  args: {
    churchId: v.string(),
    entityType: v.union(
      v.literal("task"),
      v.literal("template"),
      v.literal("cycle"),
      v.literal("team"),
      v.literal("workflow"),
      v.literal("keyDate"),
      v.literal("church"),
    ),
    entityId: v.string(),
    eventType: v.union(
      v.literal("church.created"),
      v.literal("church.updated"),
      v.literal("church.deleted"),
      v.literal("church.member.added"),
      v.literal("church.member.removed"),
      v.literal("church.member.role_updated"),
      v.literal("church.invitation.created"),
      v.literal("church.invitation.accepted"),
      v.literal("church.invitation.rejected"),
      v.literal("church.invitation.canceled"),
      v.literal("team.created"),
      v.literal("team.member.added"),
      v.literal("team.member.removed"),
    ),
    actorId: v.union(v.string(), v.null()),
    occurredAt: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await writeActivity(ctx, {
      ...args,
      actorType: "better_auth",
      cycleId: null,
    });

    return null;
  },
});
