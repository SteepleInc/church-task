import { fileURLToPath } from "node:url";

import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

const runtimeEnv = { ...process.env };

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
config({ override: true, path: fileURLToPath(new URL("../../../.env.local", import.meta.url)) });
Object.assign(process.env, runtimeEnv);

export const serverEnv = createEnv({
  clientPrefix: "VITE_",
  client: {},
  server: {
    BETTER_AUTH_SECRET: z.string().optional(),
    BETTER_AUTH_URL: z.url().optional(),
    CHURCH_INVITATION_EMAIL_FROM: z.email().optional(),
    DATABASE_URL: z.url(),
    E2E_SITE_URL: z.url().optional(),
    GOOGLE_PLACES_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    OTP_CAPTURE_ENABLED: z.enum(["0", "1"]).optional(),
    RESEND_API_KEY: z.string().optional(),
    SITE_URL: z.url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: process.env.NODE_ENV === "test",
});
