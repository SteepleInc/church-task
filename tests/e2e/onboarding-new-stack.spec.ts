import { expect, test } from "@playwright/test";

import { completeOnboarding, signInWithOtp } from "./helpers";

test.skip(
  process.env.CHURCH_TASK_E2E_ONBOARDING_STACK !== "1",
  "Run with bun run test:e2e:onboarding to boot the local Postgres/Zero onboarding stack.",
);

test.setTimeout(90_000);

test("completes OTP sign-in through onboarding on the local Postgres and Zero stack", async ({
  page,
}, testInfo) => {
  const browserErrors: Array<string> = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const email = `onboarding-new-stack-${suffix}@example.com`;
  const churchName = `E2E New Stack Church ${suffix}`;

  await signInWithOtp(page, email).catch((error: unknown) => {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\nBrowser errors:\n${browserErrors.join("\n")}`,
    );
  });
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20_000 });

  await completeOnboarding(page, churchName).catch((error: unknown) => {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\nBrowser errors:\n${browserErrors.join("\n")}`,
    );
  });

  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("My Work");
});
