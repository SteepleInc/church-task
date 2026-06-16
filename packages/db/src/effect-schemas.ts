import { createInsertSchema, createSelectSchema } from "@handfish/drizzle-effect";

import { demo_items } from "./schema";

export const DemoItemSelectSchema = createSelectSchema(demo_items);
export const DemoItemInsertSchema = createInsertSchema(demo_items);
