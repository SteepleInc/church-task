import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import { existsSync } from "node:fs";

const e2eEnvFile = ".env.e2e";
const hasE2eEnvFile = existsSync(e2eEnvFile);

if (hasE2eEnvFile) {
  config({ path: e2eEnvFile, quiet: true });
}

const requiredEnvNames = ["VITE_CONVEX_URL", "VITE_CONVEX_SITE_URL"] as const;
const missingEnvNames = requiredEnvNames.filter((name) => !process.env[name]);
const e2eEnvReady = hasE2eEnvFile && missingEnvNames.length === 0;
const e2eSkipReason = hasE2eEnvFile
  ? `Missing ${missingEnvNames.join(", ")} in ${e2eEnvFile}. E2E tests must not fall back to normal development Convex state.`
  : `Missing ${e2eEnvFile}. Copy .env.e2e.example to ${e2eEnvFile} and point it at an isolated Convex deployment before running E2E tests.`;

if (!e2eEnvReady && process.env.CI) {
  throw new Error(e2eSkipReason);
}

process.env.CHURCH_TASK_E2E_READY = e2eEnvReady ? "1" : "0";
process.env.CHURCH_TASK_E2E_SKIP_REASON = e2eSkipReason;

const e2ePort = Number(process.env.E2E_WEB_PORT ?? 2101);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(e2eEnvReady
    ? {
        webServer: {
          command: "bun run dev -- --mode e2e --host 127.0.0.1",
          cwd: "./apps/web",
          env: {
            ...process.env,
            VITE_PORT: String(e2ePort),
          },
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
