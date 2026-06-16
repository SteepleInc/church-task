import { createDb } from "@church-task/db";
import { demo_items } from "@church-task/db/schema";
import { mutators, queries, schema } from "@church-task/zero";
import { handleMutateRequest, handleQueryRequest } from "@rocicorp/zero/server";
import { zeroDrizzle } from "@rocicorp/zero/server/adapters/drizzle";
import { mustGetMutator, mustGetQuery } from "@rocicorp/zero";
import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { OptionalTracerSessionContext } from "@church-task/zero";

const getSessionContext = (request: Request): OptionalTracerSessionContext => {
  const userId = request.headers.get("x-church-task-user-id");

  if (!userId) {
    return null;
  }

  return {
    session_id: request.headers.get("x-church-task-session-id") ?? "tracer-session",
    user_id: userId,
  };
};

export const createTracerApi = (databaseUrl: string) => {
  const { db, pool } = createDb(databaseUrl);
  const zeroDb = zeroDrizzle(schema, db);

  const handleHealth = () =>
    Effect.succeed(
      Response.json({
        ok: true,
        service: "@church-task/server",
      }),
    );

  const handleCreateDemoItem = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: async () => {
        const context = getSessionContext(request);
        const body = (await request.json()) as { name?: string };
        const mutator = mustGetMutator(mutators, "demo_items.create");

        await zeroDb.transaction(async (tx) => {
          await mutator.fn({
            args: { name: body.name ?? "Tracer item" },
            ctx: context,
            tx,
          });
        });

        const [row] = await db
          .select()
          .from(demo_items)
          .where(eq(demo_items.name, body.name ?? "Tracer item"))
          .limit(1);

        return Response.json({ item: row });
      },
    });

  const handleZeroQuery = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: () =>
        handleQueryRequest(
          (name, args) =>
            mustGetQuery(queries, name).fn({
              args,
              ctx: getSessionContext(request),
            }),
          schema,
          request,
        ).then((body) => Response.json(body)),
    });

  const handleZeroMutate = (request: Request) =>
    Effect.tryPromise({
      catch: (cause) => cause,
      try: () =>
        handleMutateRequest(
          zeroDb,
          (transact) =>
            transact(async (tx, name, args) => {
              await mustGetMutator(mutators, name).fn({
                args,
                ctx: getSessionContext(request),
                tx,
              });
            }),
          request,
        ).then((body) => Response.json(body)),
    });

  const fetch = async (request: Request) => {
    const url = new URL(request.url);

    const effect =
      url.pathname === "/api/tracer" && request.method === "GET"
        ? handleHealth()
        : url.pathname === "/api/tracer/demo-items" && request.method === "POST"
          ? handleCreateDemoItem(request)
          : url.pathname === "/api/zero/query" && request.method === "POST"
            ? handleZeroQuery(request)
            : url.pathname === "/api/zero/mutate" && request.method === "POST"
              ? handleZeroMutate(request)
              : Effect.succeed(Response.json({ error: "Not found" }, { status: 404 }));

    return Effect.runPromise(effect).catch((cause) =>
      Response.json(
        { error: cause instanceof Error ? cause.message : String(cause) },
        { status: 500 },
      ),
    );
  };

  return {
    close: () => pool.end(),
    fetch,
  };
};
