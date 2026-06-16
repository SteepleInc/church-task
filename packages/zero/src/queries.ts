import { defineQueries, defineQueryWithType } from "@rocicorp/zero";
import { Schema } from "effect";

import { zql } from "./zero-schema.gen";

import type { OptionalTracerSessionContext } from "./session-context";
import type { Schema as ZeroSchema } from "./zero-schema.gen";

const DemoItemByIdArgs = Schema.standardSchemaV1(Schema.Struct({ id: Schema.String }));

const defineTracerQuery = defineQueryWithType<ZeroSchema, OptionalTracerSessionContext>();

export const queries = defineQueries({
  demo_items: {
    all: defineTracerQuery(({ ctx }) => {
      const scoped = ctx
        ? zql.demo_items.where("owner_user_id", ctx.user_id)
        : zql.demo_items.where("owner_user_id", "IS", null);

      return scoped.where("deleted_at", "IS", null).orderBy("created_at", "desc");
    }),
    by_id: defineTracerQuery(DemoItemByIdArgs, ({ args, ctx }) =>
      (ctx
        ? zql.demo_items.where("owner_user_id", ctx.user_id)
        : zql.demo_items.where("owner_user_id", "IS", null)
      )
        .where("id", args.id)
        .where("deleted_at", "IS", null)
        .one(),
    ),
  },
});
