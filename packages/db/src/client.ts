import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";

export const createPgPool = (connectionString: string) => new Pool({ connectionString });

export const createDb = (connectionString: string) => {
  const pool = createPgPool(connectionString);
  const db = drizzle(pool, { casing: "snake_case", schema });

  return { db, pool };
};

export type ChurchTaskDb = ReturnType<typeof createDb>["db"];
