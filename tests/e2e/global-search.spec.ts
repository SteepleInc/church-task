import { expect, test } from "@playwright/test";

import { completeOnboarding, signInWithOtp } from "./helpers";

test.skip(
  process.env.CHURCH_TASK_E2E_READY !== "1",
  process.env.CHURCH_TASK_E2E_SKIP_REASON ?? "E2E environment is not configured.",
);

test("opens global search via UI and slash keyboard shortcut", async ({ page }, testInfo) => {
  const email = `global-search-${Date.now()}-${testInfo.workerIndex}@example.com`;
  const churchName = `E2E Global Search Church ${Date.now()}`;

  await signInWithOtp(page, email);
  await completeOnboarding(page, churchName);

  await page.getByRole("button", { name: "Open global search" }).first().click();
  const globalSearchDialog = page.getByRole("dialog", { name: "Global Search" });
  await expect(globalSearchDialog).toBeVisible();
  await page.getByRole("textbox", { name: "Global Search" }).fill("our work");
  await expect(globalSearchDialog.getByRole("button", { name: /Our Work/ })).toBeVisible();
  await expect(globalSearchDialog.getByText("Open Page", { exact: true })).toBeVisible();
  await expect(globalSearchDialog.getByText("Navigate", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(globalSearchDialog).not.toBeVisible();

  await page.keyboard.press("/");
  await expect(globalSearchDialog).toBeVisible();
  await page.getByRole("textbox", { name: "Global Search" }).fill(churchName);
  await expect(
    globalSearchDialog.getByRole("button", { name: new RegExp(churchName) }),
  ).toBeVisible();
});
