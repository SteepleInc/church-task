/// <reference types="vite/client" />

import { describe, it } from "@effect/vitest";
import { assertEquals } from "@effect/vitest/utils";
import { convexTest } from "convex-test";
import { Effect } from "effect";
import { expect } from "vitest";

import { api } from "../convex/_generated/api";
import schema from "../convex/schema";
import * as TestConfect from "../test/TestConfect";
import refs from "./_generated/refs";

const modules = import.meta.glob("../convex/**/!(*.*.*)*.*s");

describe("unauthenticated backend behavior", () => {
  it.effect("privateData.get returns the unauthenticated message without auth", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;

      const result = yield* c.query(refs.public.privateData.get);

      expect(result).toEqual({ message: "Not authenticated" });
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("auth.getCurrentUser returns null without auth", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;

      const result = yield* c.query(refs.public.auth.getCurrentUser);

      assertEquals(result, null);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it("polar.getCurrentSubscription returns null without auth", async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.polar.getCurrentSubscription, {});

    expect(result).toBeNull();
  });

  it("polar.syncProducts rejects unauthenticated users before syncing products", async () => {
    const t = convexTest(schema, modules);

    await expect(t.action(api.polar.syncProducts, {})).rejects.toThrow("Not authenticated");
  });
});
