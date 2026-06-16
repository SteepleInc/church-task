import { createDb } from "@church-task/db";
import { getUserId } from "@church-task/shared/get-ids";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { account, session, user, verification } from "@church-task/db/schema";

export const createAuth = (databaseUrl: string) => {
  const { db, pool } = createDb(databaseUrl);

  const auth = betterAuth({
    advanced: {
      database: {
        generateId: ({ model }) => (model === "user" ? getUserId() : false),
      },
    },
    appName: "Church Task",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        account,
        session,
        user,
        verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
  });

  return { auth, db, pool };
};

export type ChurchTaskAuth = ReturnType<typeof createAuth>["auth"];
