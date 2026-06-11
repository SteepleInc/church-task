/// <reference types="vite/client" />

import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vitest";

import * as TestConfect from "../test/TestConfect";

const PASSWORD = "correct horse battery staple";

const signUpWithEmail = (c: typeof TestConfect.TestConfect.Service, email: string) =>
  c.fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:2101",
    },
    body: JSON.stringify({
      name: "Org Fallback User",
      email,
      password: PASSWORD,
    }),
  });

const signInWithEmail = (c: typeof TestConfect.TestConfect.Service, email: string) =>
  c.fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:2101",
    },
    body: JSON.stringify({ email, password: PASSWORD }),
  });

const signOut = (c: typeof TestConfect.TestConfect.Service, token: string) =>
  c.fetch("/api/auth/sign-out", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: "http://localhost:2101",
    },
    body: JSON.stringify({}),
  });

const createChurch = (
  c: typeof TestConfect.TestConfect.Service,
  args: { readonly token: string; readonly name: string; readonly slug: string },
) =>
  c.fetch("/api/auth/organization/create", {
    method: "POST",
    headers: {
      authorization: `Bearer ${args.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: args.name,
      slug: args.slug,
      churchTimeZone: "America/New_York",
    }),
  });

const getSession = function* (c: typeof TestConfect.TestConfect.Service, token: string) {
  const response = yield* c.fetch("/api/auth/get-session", {
    method: "GET",
    headers: { authorization: `Bearer ${token}` },
  });

  expect(response.status).toBe(200);

  return (yield* Effect.promise(() => response.json())) as {
    session?: { activeOrganizationId?: string | null };
  };
};

describe("Active Church restoration at login", () => {
  it.effect("sign-in restores the user's Church as the Active Church", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;
      const email = `org-fallback-${crypto.randomUUID()}@example.com`;

      const signUpResponse = yield* signUpWithEmail(c, email);
      const signUpBody = (yield* Effect.promise(() => signUpResponse.json())) as {
        token?: string;
      };
      expect(signUpResponse.status).toBe(200);

      const churchResponse = yield* createChurch(c, {
        token: signUpBody.token!,
        name: "Fallback Church",
        slug: `fallback-${crypto.randomUUID()}`,
      });
      const church = (yield* Effect.promise(() => churchResponse.json())) as { id?: string };
      expect(churchResponse.status).toBe(200);

      const signOutResponse = yield* signOut(c, signUpBody.token!);
      expect(signOutResponse.status).toBe(200);

      const signInResponse = yield* signInWithEmail(c, email);
      const signInBody = (yield* Effect.promise(() => signInResponse.json())) as {
        token?: string;
      };
      expect(signInResponse.status).toBe(200);

      const session = yield* getSession(c, signInBody.token!);

      expect(session.session?.activeOrganizationId).toBe(church.id);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("sign-in restores the previous session's Active Church over newer memberships", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;
      const email = `org-fallback-previous-${crypto.randomUUID()}@example.com`;

      const signUpResponse = yield* signUpWithEmail(c, email);
      const signUpBody = (yield* Effect.promise(() => signUpResponse.json())) as {
        token?: string;
      };

      const firstChurchResponse = yield* createChurch(c, {
        token: signUpBody.token!,
        name: "First Church",
        slug: `first-${crypto.randomUUID()}`,
      });
      const firstChurch = (yield* Effect.promise(() => firstChurchResponse.json())) as {
        id?: string;
      };

      const secondChurchResponse = yield* createChurch(c, {
        token: signUpBody.token!,
        name: "Second Church",
        slug: `second-${crypto.randomUUID()}`,
      });
      expect(secondChurchResponse.status).toBe(200);

      const setActiveResponse = yield* c.fetch("/api/auth/organization/set-active", {
        method: "POST",
        headers: {
          authorization: `Bearer ${signUpBody.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ organizationId: firstChurch.id }),
      });
      expect(setActiveResponse.status).toBe(200);

      // Sign in from a second device; the first session still exists with
      // First Church active, while Second Church is the newer membership.
      const signInResponse = yield* signInWithEmail(c, email);
      const signInBody = (yield* Effect.promise(() => signInResponse.json())) as {
        token?: string;
      };
      expect(signInResponse.status).toBe(200);

      const session = yield* getSession(c, signInBody.token!);

      expect(session.session?.activeOrganizationId).toBe(firstChurch.id);
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect("a user with no Churches gets no Active Church at login", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;
      const email = `org-fallback-none-${crypto.randomUUID()}@example.com`;

      const signUpResponse = yield* signUpWithEmail(c, email);
      const signUpBody = (yield* Effect.promise(() => signUpResponse.json())) as {
        token?: string;
      };
      expect(signUpResponse.status).toBe(200);

      const session = yield* getSession(c, signUpBody.token!);

      expect(session.session?.activeOrganizationId ?? null).toBeNull();
    }).pipe(Effect.provide(TestConfect.layer())),
  );
});
