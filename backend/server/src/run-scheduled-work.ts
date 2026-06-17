import { createDb } from "@church-task/db";
import { Effect } from "effect";

import { runScheduledCycleMaintenance } from "./scheduled-work";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run scheduled cycle maintenance.");
}

const { db, pool } = createDb(connectionString);

try {
  const result = await Effect.runPromise(runScheduledCycleMaintenance(db));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await pool.end();
}
