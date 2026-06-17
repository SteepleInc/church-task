# Agent Platform Setup

This guide verifies the local CLI and MCP setup path for [PRD #11: Agent CLI and MCP Foundation](https://github.com/SteepleInc/church-task/issues/11). It is the smoke-test path for AFK agents and contributors who need non-browser access to Church Task operations.

## Prerequisites

- Install dependencies with `bun install`.
- Start the new server stack with `bun run dev:server` or the E2E harness for integration tests.
- Use Bun commands from the repo root.

## Environment

Set these variables before running agent-platform commands:

```bash
export CHURCH_TASK_API_URL="http://127.0.0.1:3000"
```

`CHURCH_TASK_SITE_URL` can be used instead of `CHURCH_TASK_API_URL` when the TanStack Start app and server API share one origin.

For CI, AFK agents, or local sandboxes, set `CHURCH_TASK_CREDENTIAL_FILE` to keep local CLI credentials out of your normal home directory:

```bash
export CHURCH_TASK_CREDENTIAL_FILE="$PWD/.tmp/church-task-credential.json"
```

Do not commit that file.

## CLI Health Smoke Test

Run the public health command:

```bash
bun packages/cli/src/bin.ts health
```

Expected successful output:

```json
{ "ok": true, "operation": "health", "status": "OK" }
```

If `CHURCH_TASK_API_URL` and `CHURCH_TASK_SITE_URL` are missing, the command should fail with a structured setup error instead of a stack trace:

```json
{
  "ok": false,
  "error": {
    "code": "missing_backend_config",
    "message": "Set CHURCH_TASK_API_URL or CHURCH_TASK_SITE_URL to your Church Task server URL."
  }
}
```

## CLI Authentication Smoke Test

Use an explicit Better Auth bearer token only as a bootstrap token for creating a named CLI credential:

```bash
export CHURCH_TASK_AUTH_TOKEN="<short-lived Better Auth bearer token>"
bun packages/cli/src/bin.ts login --name "local-agent"
unset CHURCH_TASK_AUTH_TOKEN
```

Expected login output includes credential metadata, not the raw token:

```json
{
  "ok": true,
  "operation": "login",
  "credential": { "id": "<credential id>", "name": "local-agent", "start": "ctcli_" }
}
```

After login, verify the stored credential resolves the current User through the shared typed operation path:

```bash
bun packages/cli/src/bin.ts auth status
bun packages/cli/src/bin.ts current-user
```

Church access is derived from Church Membership and Active Church session state, not from the CLI credential itself.

## Credential Safety And Revocation

- CLI credentials are named, user-owned Better Auth API keys with `ctcli_` token starts.
- Server-side credential records are hashed at rest by Better Auth storage.
- Local credential material is stored in `~/.church-task/credential.json` by default, or in `CHURCH_TASK_CREDENTIAL_FILE` when set.
- The CLI writes the credential file with restrictive file permissions where the operating system honors POSIX modes.
- Command output must not print raw `CHURCH_TASK_AUTH_TOKEN` values or stored CLI tokens.
- Use `CHURCH_TASK_AUTH_TOKEN` for explicit bootstrap or CI override flows only. Unset it after `login` so later commands use the stored credential.
- Revoke and remove the local credential with:

```bash
bun packages/cli/src/bin.ts auth logout
```

Expected logout output omits the raw token:

```json
{
  "ok": true,
  "operation": "logout",
  "revoked": true,
  "credential": { "id": "<credential id>", "name": "local-agent", "start": "ctcli_" }
}
```

If a local token is lost, run `auth logout` from that machine when possible. If the local file is unavailable, revoke the named API key through the Better Auth API-key management path once a product UI or admin workflow exposes it.

## MCP Discovery Smoke Test

MCP clients call the same server origin as the CLI:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"churchId":"<org id>"}' \
  "$CHURCH_TASK_API_URL/api/mcp/tools/list-tasks"
```

Expected output is a structured tool response:

```json
{ "ok": true, "tool": "list-tasks", "tasks": [] }
```

Agent setup reads use the new Drizzle-backed batch read endpoint:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"operations":[{"id":"teams","operation":"listTeams","input":{"churchId":"<org id>"}}]}' \
  "$CHURCH_TASK_API_URL/api/agent/core-work/batch-read"
```

Invalid bearer tokens must be rejected without leaking the token value:

```bash
curl -i \
  -H "Authorization: Bearer invalid-mcp-token" \
  "$CHURCH_TASK_API_URL/api/agent/current-user"
```

Expected response status is `401` with a structured error:

```json
{ "ok": false, "error": { "code": "UNAUTHENTICATED", "message": "Authentication required" } }
```

## Verification Commands

Run the feedback loops that cover this setup path:

```bash
bun run test:cli
bun run test:backend
bun run check-types
```

`bun run test:cli` verifies CLI health output, missing configuration errors, auth status, login, logout, credential storage, and secret-safe structured errors with fake Effect layers. `bun --filter @church-task/server test` verifies authenticated agent reads and representative MCP task operations through public HTTP routes backed by Drizzle.
