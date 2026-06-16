import { createDb } from "@church-task/db";
import { member, organization, user } from "@church-task/db/schema";
import { getOrgId, getOrgUserId, getSessionId, getUserId } from "@church-task/shared/get-ids";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { describe, expect, test } from "vitest";

import {
  createAuthOptions,
  createLocalOtpStore,
  enrichActiveOrganizationSession,
  enrichNewSession,
} from "./auth";

describe("Better Auth Postgres foundation", () => {
  test("wires the Church Task auth plugin set and local OTP capture", async () => {
    const container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const { db, pool } = createDb(container.getConnectionUri());

    try {
      await migrate(db, {
        migrationsFolder: new URL("../../db/drizzle", import.meta.url).pathname,
      });

      const otpStore = createLocalOtpStore();
      const options = createAuthOptions(db, otpStore);

      expect(options.plugins?.map((plugin) => plugin.id)).toEqual([
        "complete-onboarding",
        "clear-org-for-onboarding",
        "email-otp",
        "organization",
        "admin",
        "custom-session",
      ]);

      await otpStore.sendVerificationOTP({
        email: "avery.member@church-task.test",
        otp: "123456",
        type: "sign-in",
      });

      expect(otpStore.getLatestOtp("avery.member@church-task.test", "sign-in")).toEqual({
        email: "avery.member@church-task.test",
        otp: "123456",
        type: "sign-in",
      });
    } finally {
      await pool.end();
      await container.stop();
    }
  }, 60_000);

  test("enriches session records with App Admin and active Church context", async () => {
    const container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const { db, pool } = createDb(container.getConnectionUri());

    try {
      await migrate(db, {
        migrationsFolder: new URL("../../db/drizzle", import.meta.url).pathname,
      });

      const userId = getUserId();
      const orgId = getOrgId();

      await db.insert(user).values({
        email: "ada.admin@church-task.test",
        emailVerified: true,
        id: userId,
        name: "Ada App Administrator",
        role: "admin",
      });

      await db.insert(organization).values({
        churchTimeZone: "America/Chicago",
        completedOnboarding: true,
        id: orgId,
        name: "Seed Church",
        slug: "seed-church",
      });

      await db.insert(member).values({
        id: getOrgUserId(),
        organizationId: orgId,
        role: "owner",
        userId,
      });

      const enriched = await enrichNewSession(db, {
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        id: getSessionId(),
        token: "session-token",
        userId,
      });

      expect(enriched).toMatchObject({
        activeOrganizationId: orgId,
        orgCompletedOnboarding: true,
        orgRole: "owner",
        orgType: "church",
        userRole: "admin",
      });

      const activeOrgUpdate = await enrichActiveOrganizationSession(
        db,
        { activeOrganizationId: orgId },
        userId,
      );

      expect(activeOrgUpdate).toMatchObject({
        activeOrganizationId: orgId,
        orgCompletedOnboarding: true,
        orgRole: "owner",
        orgType: "church",
        skipOrgFallback: false,
      });
    } finally {
      await pool.end();
      await container.stop();
    }
  }, 60_000);
});
