import { expect, type Page, test } from "@playwright/test";

import { completeOnboarding, getE2eApiUrl, signInWithOtp, waitForOtp } from "./helpers";

test.skip(
  process.env.CHURCH_TASK_E2E_READY !== "1",
  process.env.CHURCH_TASK_E2E_SKIP_REASON ?? "E2E environment is not configured.",
);

async function createTestInvitation(
  page: Page,
  invitation: { readonly email: string; readonly role: "member" | "admin" },
) {
  const sessionToken = await page.evaluate(async () => {
    const { authClient } = await import("/src/lib/auth-client.ts");
    const session = await authClient.getSession();

    return session.data?.session.token ?? null;
  });

  expect(sessionToken).toEqual(expect.any(String));

  const response = await page.request.post(`${getE2eApiUrl()}/api/test/invitations`, {
    data: invitation,
    headers: { Authorization: `Bearer ${sessionToken}` },
  });

  test.skip(response.status() === 404, "Test invitation helper is not deployed.");
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as { invitation: { id: string } };
  return body.invitation.id;
}

async function signOut(page: Page) {
  await page.evaluate(async () => {
    const { authClient } = await import("/src/lib/auth-client.ts");
    await authClient.signOut();
  });
}

test("accepts an invitation through OTP sign-in and shows shared member visibility", async ({
  page,
}, testInfo) => {
  const ownerEmail = `invite-owner-${Date.now()}-${testInfo.workerIndex}@example.com`;
  const inviteeEmail = `invitee-${Date.now()}-${testInfo.workerIndex}@example.com`;
  const churchName = `E2E Invited Church ${Date.now()}`;

  await signInWithOtp(page, ownerEmail);
  await completeOnboarding(page, churchName);
  const invitationId = await createTestInvitation(page, { email: inviteeEmail, role: "member" });
  await signOut(page);

  await page.goto(`/accept-invitation/${invitationId}`);
  await expect(page).toHaveURL(new RegExp(`/sign-in\\?invitation-id=${invitationId}$`));
  await page.getByLabel("Email address").fill(inviteeEmail);
  await page.locator('button[data-loading="false"]', { hasText: "Continue" }).click();
  await page.getByLabel("Verification Code").fill(await waitForOtp(page, inviteeEmail));

  await expect(page).toHaveURL(new RegExp(`/accept-invitation/${invitationId}$`));
  await expect(page.getByText("Church Invitation", { exact: true })).toBeVisible();
  await expect(page.getByText(churchName)).toBeVisible();
  await page.getByRole("button", { name: /Accept Invitation/ }).click();

  await expect(page).toHaveURL(/\/my-work$/, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: new RegExp(churchName) })).toBeVisible();

  await page.goto("/settings/workspace/members");
  const inviteeMembersTable = page.getByRole("table").first();
  await expect(inviteeMembersTable.getByText(inviteeEmail)).toBeVisible({ timeout: 20_000 });
  await expect(inviteeMembersTable.getByText(ownerEmail)).toBeVisible({ timeout: 20_000 });

  await signOut(page);
  await signInWithOtp(page, ownerEmail);
  await page.goto("/settings/workspace/members");
  const ownerMembersTable = page.getByRole("table").first();
  await expect(ownerMembersTable.getByText(ownerEmail)).toBeVisible({ timeout: 20_000 });
  await expect(ownerMembersTable.getByText(inviteeEmail)).toBeVisible({ timeout: 20_000 });
});
