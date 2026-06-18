import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const createPgPool = (connectionString: string) => {
  const pool = new Pool({ connectionString });

  pool.on("error", () => {
    // pg emits idle-client errors here, including expected testcontainer shutdowns.
  });

  return pool;
};

export const createDb = (connectionString: string) => {
  const pool = createPgPool(connectionString);
  const db = drizzle({ client: pool });

  return { db, pool };
};

export type ChurchTaskDb = ReturnType<typeof createDb>["db"];
