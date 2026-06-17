import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";
import { SQL } from "bun";

config({ path: ".env" });
config({ override: true, path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to nuke the local database.");
}

const parsedDatabaseUrl = new URL(databaseUrl);
const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const force = process.env.FORCE_LOCAL_DB_NUKE === "1";

if (!force && !localHosts.has(parsedDatabaseUrl.hostname)) {
  throw new Error(
    `Refusing to nuke non-local database host ${parsedDatabaseUrl.hostname}. Set FORCE_LOCAL_DB_NUKE=1 to override.`,
  );
}

const zeroReplicaFiles = [
  join(process.cwd(), "packages", "zero", "zero.db"),
  join(process.cwd(), "packages", "zero", "zero.db-shm"),
  join(process.cwd(), "packages", "zero", "zero.db-wal"),
];

const sql = new SQL(databaseUrl);

try {
  const result = await sql<{ table_name: string }[]>`
    select tablename as table_name
    from pg_tables
    where schemaname = 'public'
      and tablename <> '__drizzle_migrations'
  `;

  const tables = result.map((row) => row.table_name);

  if (tables.length > 0) {
    const tableList = tables.map((table) => `"${table.replaceAll('"', '""')}"`).join(", ");
    await sql.unsafe(`truncate table ${tableList} restart identity cascade`);
  }

  for (const filePath of zeroReplicaFiles) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  console.info(`Nuked ${tables.length} local database tables.`);
  console.info("Local database is empty; schema migrations were left intact.");
} finally {
  await sql.close();
}
