import { DemoItemSelectSchema, demo_items } from "@church-task/db";
import { getDemoItemId, getUserId } from "@church-task/shared/get-ids";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { startPostgresHarness } from ".";

describe("Drizzle tracer schema", () => {
  test("applies migrations and stores Date-backed UTC timestamps", async () => {
    const harness = await startPostgresHarness();

    try {
      const id = getDemoItemId();
      const userId = getUserId();

      await harness.db.insert(demo_items).values({
        _tag: "demo_item",
        created_by: userId,
        id,
        name: "Migrated tracer item",
        owner_user_id: userId,
        updated_by: userId,
      });

      const [row] = await harness.db.select().from(demo_items).where(eq(demo_items.id, id));

      expect(row).toBeDefined();
      expect(row?.created_at).toBeInstanceOf(Date);
      expect(row?.updated_at).toBeInstanceOf(Date);
      expect(DemoItemSelectSchema).toBeDefined();
    } finally {
      await harness.stop();
    }
  }, 60_000);
});
