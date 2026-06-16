import { getDemoItemId } from "@church-task/shared/get-ids";
import { defineMutatorWithType, defineMutators } from "@rocicorp/zero";
import { Schema } from "effect";

import { demo_items } from "@church-task/db/schema";

import type { OptionalTracerSessionContext } from "./session-context";
import type { Schema as ZeroSchema } from "./zero-schema.gen";

const CreateDemoItemArgs = Schema.standardSchemaV1(Schema.Struct({ name: Schema.String }));

const defineTracerMutator = defineMutatorWithType<
  ZeroSchema,
  OptionalTracerSessionContext,
  unknown
>();

export const mutators = defineMutators({
  demo_items: {
    create: defineTracerMutator(CreateDemoItemArgs, async ({ args, ctx, tx }) => {
      if (tx.location !== "server") {
        throw new Error("demo_items.create must run on the server");
      }

      const now = new Date();
      const userId = ctx?.user_id ?? null;

      const serverTx = tx as typeof tx & {
        readonly dbTransaction: {
          readonly wrappedTransaction: { insert: (table: typeof demo_items) => any };
        };
      };

      await serverTx.dbTransaction.wrappedTransaction.insert(demo_items).values({
        _tag: "demo_item",
        created_at: now,
        created_by: userId,
        id: getDemoItemId(),
        name: args.name,
        owner_user_id: userId,
        updated_at: now,
        updated_by: userId,
      });
    }),
  },
});
