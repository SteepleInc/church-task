import { createAuth } from "@church-task/auth";
import { invitation } from "@church-task/db/schema";
import { startPostgresHarness } from "@church-task/test-harness";
import { describe, expect, test } from "vitest";

import { createTracerApi } from "./tracer-api";

const getCookieHeader = (response: Response) => {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Expected Better Auth to set a session cookie");
  }

  return setCookie;
};

describe("tracer API", () => {
  test("captures email OTPs through the local Better Auth route", async () => {
    const harness = await startPostgresHarness();
    const api = createTracerApi(harness.connectionString);

    try {
      const email = "new-stack-otp@church-task.test";
      const sendResponse = await api.fetch(
        new Request("http://127.0.0.1/api/auth/email-otp/send-verification-otp", {
          body: JSON.stringify({ email, type: "sign-in" }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }),
      );

      expect(sendResponse.ok).toBe(true);

      const otpResponse = await api.fetch(
        new Request(`http://127.0.0.1/api/test/otp?email=${encodeURIComponent(email)}`),
      );
      const body = (await otpResponse.json()) as { otp?: string | null };

      expect(otpResponse.ok).toBe(true);
      expect(body.otp).toMatch(/^\d{6}$/);
    } finally {
      await api.close();
      await harness.stop();
    }
  }, 60_000);

  test("creates a demo item through the signed-in Zero mutator path", async () => {
    const harness = await startPostgresHarness();
    const api = createTracerApi(harness.connectionString);
    const authRuntime = createAuth(harness.connectionString);

    try {
      const signUp = await authRuntime.auth.api.signUpEmail({
        asResponse: true,
        body: {
          email: "zero-foundation@church-task.test",
          name: "Zero Foundation User",
          password: "correct horse battery staple",
        },
      });
      const cookie = getCookieHeader(signUp);

      const response = await api.fetch(
        new Request("http://127.0.0.1/api/tracer/demo-items", {
          body: JSON.stringify({ name: "Zero mutator tracer" }),
          headers: {
            "content-type": "application/json",
            cookie,
          },
          method: "POST",
        }),
      );

      expect(response.ok).toBe(true);
      const body = (await response.json()) as {
        item?: {
          created_by?: string | null;
          id?: string;
          name?: string;
          owner_user_id?: string | null;
        };
      };

      expect(body.item?.id).toMatch(/^demoitem_/);
      expect(body.item?.name).toBe("Zero mutator tracer");
      expect(body.item?.created_by).toMatch(/^user_/);
      expect(body.item?.owner_user_id).toBe(body.item?.created_by);

      const queryResponse = await api.fetch(
        new Request("http://127.0.0.1/api/zero/query", {
          body: JSON.stringify([
            "transform",
            [{ args: [], id: "demo-items-all", name: "demo_items.all" }],
          ]),
          headers: {
            "content-type": "application/json",
            cookie,
          },
          method: "POST",
        }),
      );
      const queryBody = (await queryResponse.json()) as {
        kind?: string;
        queries?: Array<{ error?: string; id?: string; name?: string }>;
      };

      expect(queryResponse.ok).toBe(true);
      expect(queryBody.kind).toBe("QueryResponse");
      expect(queryBody.queries).toEqual([
        expect.objectContaining({ id: "demo-items-all", name: "demo_items.all" }),
      ]);
      expect(queryBody.queries?.[0]?.error).toBeUndefined();
    } finally {
      await authRuntime.pool.end();
      await api.close();
      await harness.stop();
    }
  }, 60_000);

  test("rejects unauthenticated Zero mutator writes", async () => {
    const harness = await startPostgresHarness();
    const api = createTracerApi(harness.connectionString);

    try {
      const response = await api.fetch(
        new Request("http://127.0.0.1/api/tracer/demo-items", {
          body: JSON.stringify({ name: "Anonymous write" }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }),
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({ error: "Authentication required." });
    } finally {
      await api.close();
      await harness.stop();
    }
  }, 60_000);

  test("creates a test invitation for the active Church", async () => {
    const harness = await startPostgresHarness();
    const api = createTracerApi(harness.connectionString);
    const authRuntime = createAuth(harness.connectionString);

    try {
      const signUp = await authRuntime.auth.api.signUpEmail({
        asResponse: true,
        body: {
          email: "inviter@church-task.test",
          name: "Invitation Test User",
          password: "correct horse battery staple",
        },
      });
      const cookie = getCookieHeader(signUp);

      const org = await authRuntime.auth.api.createOrganization({
        body: {
          churchTimeZone: "America/Chicago",
          name: "Invitation Test Church",
          slug: "invitation-test-church",
        },
        headers: new Headers({ cookie }),
      });

      expect(org?.id).toMatch(/^org_/);

      const response = await api.fetch(
        new Request("http://127.0.0.1/api/test/invitations", {
          body: JSON.stringify({ email: "Invitee@Church-Task.test", role: "admin" }),
          headers: {
            "content-type": "application/json",
            cookie,
          },
          method: "POST",
        }),
      );

      expect(response.ok).toBe(true);
      const body = (await response.json()) as { invitation?: { id?: string } };

      expect(body.invitation?.id).toMatch(/^churchinvitation_/);
      await expect(authRuntime.db.select().from(invitation)).resolves.toMatchObject([
        {
          email: "invitee@church-task.test",
          id: body.invitation?.id,
          organizationId: org?.id,
          role: "admin",
          status: "pending",
        },
      ]);
    } finally {
      await authRuntime.pool.end();
      await api.close();
      await harness.stop();
    }
  }, 60_000);
});
