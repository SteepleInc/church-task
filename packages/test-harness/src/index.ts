import { createDb } from "@church-task/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

export const startPostgresHarness = async () => {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const connectionString = container.getConnectionUri();
  const { db, pool } = createDb(connectionString);

  await migrate(db, { migrationsFolder: new URL("../../db/drizzle", import.meta.url).pathname });

  return {
    connectionString,
    db,
    async stop() {
      await pool.end();
      await container.stop();
    },
  };
};
