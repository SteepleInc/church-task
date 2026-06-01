import { v } from "convex/values";

import registeredFunctions from "../confect/_generated/registeredFunctions";
import { seedDefaultWorkModel } from "../workDefaults";
import { internalMutation } from "./_generated/server";

export const seedForChurch = registeredFunctions.workDefaults.seedForChurch;
export const readForChurch = registeredFunctions.workDefaults.readForChurch;

export const internalSeedForChurch = internalMutation({
  args: { churchId: v.string() },
  handler: async (ctx, args) => {
    await seedDefaultWorkModel(ctx, args.churchId);
    return null;
  },
});
