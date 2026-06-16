import { getDemoItemId, getUserId } from "@church-task/shared/get-ids";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { describe, expect, test } from "vitest";

import { createDb } from "./client";
import { baseEntityFields, demo_items } from "./schema";

describe("schema foundation", () => {
  test("applies migrations and enforces foundation conventions", async () => {
    const container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const { db, pool } = createDb(container.getConnectionUri());

    try {
      await migrate(db, { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });

      const foreignKeys = await pool.query<{ constraint_name: string }>(
        "select constraint_name from information_schema.table_constraints where table_schema = 'public' and constraint_type = 'FOREIGN KEY'",
      );
      const genericLifecycleColumns = await pool.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema = 'public' and table_name not in ('invitation') and column_name in ('status', 'inactivated_at', 'inactivated_by')",
      );

      const userId = getUserId();
      const liveId = getDemoItemId();
      const deletedId = getDemoItemId();

      await db.insert(demo_items).values({
        _tag: "demo_item",
        created_by: userId,
        id: liveId,
        name: "Unique live item",
        owner_user_id: userId,
        updated_by: userId,
      });

      await expect(
        db.insert(demo_items).values({
          _tag: "demo_item",
          created_by: userId,
          id: getDemoItemId(),
          name: "Unique live item",
          owner_user_id: userId,
          updated_by: userId,
        }),
      ).rejects.toThrow(/Failed query/u);

      await db.insert(demo_items).values({
        _tag: "demo_item",
        created_by: userId,
        deleted_at: new Date(),
        deleted_by: userId,
        id: deletedId,
        name: "Unique live item",
        owner_user_id: userId,
        updated_by: userId,
      });

      const [row] = await db.select().from(demo_items).where(eq(demo_items.id, liveId));

      expect(foreignKeys.rows).toEqual([]);
      expect(genericLifecycleColumns.rows).toEqual([]);
      expect(Object.keys(baseEntityFields).sort()).toEqual([
        "_tag",
        "created_at",
        "created_by",
        "deleted_at",
        "deleted_by",
        "updated_at",
        "updated_by",
      ]);
      expect(row).toMatchObject({
        _tag: "demo_item",
        created_by: userId,
        deleted_at: null,
        deleted_by: null,
        id: liveId,
        name: "Unique live item",
        owner_user_id: userId,
        updated_by: userId,
      });
      expect(row?.created_at).toBeInstanceOf(Date);
      expect(row?.updated_at).toBeInstanceOf(Date);
    } finally {
      await pool.end();
      await container.stop();
    }
  }, 60_000);
});
