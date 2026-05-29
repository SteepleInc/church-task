/// <reference types="vite/client" />

import { describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vitest";

import * as TestConfect from "../test/TestConfect";
import refs from "./_generated/refs";

const decodeJwtPayload = (token: string) =>
  JSON.parse(atob(token.split(".")[1]!.replaceAll("-", "+").replaceAll("_", "/"))) as {
    sessionId?: string;
  };

describe("Better Auth authenticated state spike", () => {
  it.effect("convex-test identity alone does not authenticate Better Auth-backed queries", () =>
    Effect.gen(function* () {
      const c = yield* TestConfect.TestConfect;
      const authenticated = c.withIdentity({
        subject: "identity-only-user",
        sessionId: "identity-only-session",
      });

      const result = yield* authenticated.query(refs.public.privateData.get);

      expect(result).toEqual({ message: "Not authenticated" });
    }).pipe(Effect.provide(TestConfect.layer())),
  );

  it.effect(
    "Better Auth HTTP signup route creates backend auth state usable by Confect queries",
    () =>
      Effect.gen(function* () {
        const c = yield* TestConfect.TestConfect;
        const email = `convex-test-${crypto.randomUUID()}@example.com`;

        const response = yield* c.fetch("/api/auth/sign-up/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:2101",
          },
          body: JSON.stringify({
            name: "Convex Test User",
            email,
            password: "correct horse battery staple",
          }),
        });

        expect(response.status).toBe(200);

        const body = (yield* Effect.promise(() => response.json())) as {
          user?: { id?: string; email?: string };
          token?: string;
        };

        expect(body.user?.email).toBe(email);
        expect(body.user?.id).toEqual(expect.any(String));
        expect(body.token).toEqual(expect.any(String));

        const tokenResponse = yield* c.fetch("/api/auth/convex/token", {
          method: "GET",
          headers: { authorization: `Bearer ${body.token}` },
        });
        const tokenBody = (yield* Effect.promise(() => tokenResponse.json())) as {
          token?: string;
        };
        const tokenPayload = decodeJwtPayload(tokenBody.token!);

        expect(tokenResponse.status).toBe(200);
        expect(tokenBody.token).toEqual(expect.any(String));
        expect(tokenPayload.sessionId).toEqual(expect.any(String));

        const authenticated = c.withIdentity({
          subject: body.user!.id!,
          sessionId: tokenPayload.sessionId!,
        });

        const privateData = yield* authenticated.query(refs.public.privateData.get);
        const currentUser = yield* authenticated.query(refs.public.auth.getCurrentUser);

        expect(privateData).toEqual({ message: "This is private" });
        expect(currentUser).toMatchObject({
          _id: body.user!.id!,
          email,
          name: "Convex Test User",
        });
      }).pipe(Effect.provide(TestConfect.layer())),
  );
});
