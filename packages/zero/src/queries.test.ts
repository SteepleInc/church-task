import { mustGetQuery } from "@rocicorp/zero";
import { describe, expect, test } from "vitest";

import { queries } from "./queries";

import type { ZeroSessionContext } from "./session-context";

const memberContext = {
  active_church_id: "org_member",
  authenticated: true,
  church_role: "member",
  is_app_admin: false,
  runtime: "server",
  session_id: "session_member",
  user_id: "user_member",
} satisfies ZeroSessionContext;

const appAdminContext = {
  ...memberContext,
  is_app_admin: true,
  session_id: "session_admin",
  user_id: "user_admin",
} satisfies ZeroSessionContext;

const churchScopedQueryNames = [
  "cycles.by_church",
  "focus_windows.by_church",
  "key_date_occurrences.by_church",
  "key_dates.by_church",
  "labels.by_church",
  "team_memberships.by_church",
  "teams.by_church",
  "template_tasks.by_church",
  "template_teams.by_church",
  "templates.by_church",
  "tasks.by_church",
  "workflows.by_church",
  "workflow_statuses.by_church",
] as const;

describe("Zero product queries", () => {
  test("does not throw while the browser is still refreshing active Church context", () => {
    expect(() =>
      mustGetQuery(queries, "teams.by_church").fn({
        args: { church_id: "org_missing" },
        ctx: null,
      }),
    ).not.toThrow();
  });

  test("fails closed for unauthenticated server-side Team queries", () => {
    expect(() =>
      mustGetQuery(queries, "teams.by_church").fn({
        args: { church_id: "org_missing" },
        ctx: { authenticated: false, runtime: "server" },
      }),
    ).toThrow("Authentication required.");
  });

  test("fails closed for unauthenticated server-side Workflow queries", () => {
    for (const name of [
      "team_memberships.by_church",
      "labels.by_church",
      "workflows.by_church",
      "workflow_statuses.by_church",
    ] as const) {
      expect(() =>
        mustGetQuery(queries, name).fn({
          args: { church_id: "org_missing" },
          ctx: { authenticated: false, runtime: "server" },
        }),
      ).toThrow("Authentication required.");
    }
  });

  test("requires App Administrator context for admin collections", () => {
    expect(() =>
      mustGetQuery(queries, "organization.admin_list").fn({
        args: { list_args: { limit: 25 } },
        ctx: { authenticated: false, runtime: "server" },
      }),
    ).toThrow("Authentication required.");

    expect(() =>
      mustGetQuery(queries, "user.admin_list").fn({
        args: { list_args: { limit: 25 } },
        ctx: {
          active_church_id: "org_123",
          authenticated: true,
          church_role: "member",
          is_app_admin: false,
          runtime: "server",
          session_id: "session_123",
          user_id: "user_123",
        },
      }),
    ).toThrow("App Administrator access required.");
  });

  test("rejects cross-Church product collection queries for normal members", () => {
    for (const name of churchScopedQueryNames) {
      expect(() =>
        mustGetQuery(queries, name).fn({
          args: { church_id: "org_other" },
          ctx: memberContext,
        }),
      ).toThrow("Active Church access required.");
    }
  });

  test("allows App Administrators to query cross-Church product collections", () => {
    for (const name of churchScopedQueryNames) {
      expect(() =>
        mustGetQuery(queries, name).fn({
          args: { church_id: "org_other" },
          ctx: appAdminContext,
        }),
      ).not.toThrow();
    }
  });
});
