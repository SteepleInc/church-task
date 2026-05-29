import { Schema } from "effect";

export const AgentUser = Schema.Struct({
  id: Schema.String,
  email: Schema.Union(Schema.String, Schema.Null),
  name: Schema.Union(Schema.String, Schema.Null),
});

export const CurrentUserData = Schema.Struct({
  user: Schema.Union(AgentUser, Schema.Null),
});

export const CurrentUserResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Literal("currentUser"),
  data: CurrentUserData,
});

export const McpCurrentUserToolResponse = Schema.Struct({
  ok: Schema.Literal(true),
  tool: Schema.Literal("currentUser"),
  result: CurrentUserResponse,
});

export const BatchReadArgs = Schema.Struct({
  operations: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      operation: Schema.Literal("currentUser"),
      input: Schema.Struct({}),
    }),
  ),
});

export const BatchReadResponse = Schema.Struct({
  ok: Schema.Literal(true),
  operation: Schema.Literal("batchRead"),
  results: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      ok: Schema.Literal(true),
      operation: Schema.Literal("currentUser"),
      data: CurrentUserData,
    }),
  ),
});

export type CurrentUserResponse = typeof CurrentUserResponse.Type;
export type McpCurrentUserToolResponse = typeof McpCurrentUserToolResponse.Type;
export type BatchReadResponse = typeof BatchReadResponse.Type;

export const currentUserResponse = (user: typeof AgentUser.Type | null): CurrentUserResponse => ({
  ok: true,
  operation: "currentUser",
  data: { user },
});

export const mcpCurrentUserToolResponse = (
  user: typeof AgentUser.Type,
): McpCurrentUserToolResponse => ({
  ok: true,
  tool: "currentUser",
  result: currentUserResponse(user),
});

export const batchReadResponse = (
  operations: ReadonlyArray<{ readonly id: string }>,
  data: typeof CurrentUserData.Type,
): BatchReadResponse => ({
  ok: true,
  operation: "batchRead",
  results: operations.map((operation) => ({
    id: operation.id,
    ok: true,
    operation: "currentUser",
    data,
  })),
});
