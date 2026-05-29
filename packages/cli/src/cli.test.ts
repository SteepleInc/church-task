import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { BackendClient, BackendError, type BackendClientService, runCli } from "./cli";

const fakeBackend = (healthCheck: BackendClientService["healthCheck"]) =>
  Layer.succeed(BackendClient, { healthCheck });

describe("church-task health", () => {
  it("prints machine-readable success when the backend health operation succeeds", async () => {
    const result = await runCli(["health"], {
      env: {},
      backendLayer: fakeBackend(Effect.succeed("OK" as const)),
    });

    expect(result).toEqual({
      exitCode: 0,
      stderr: "",
      stdout: `${JSON.stringify({ ok: true, operation: "health", status: "OK" })}\n`,
    });
  });

  it("returns a structured error when backend configuration is missing", async () => {
    const result = await runCli(["health"], { env: {} });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      error: {
        code: "missing_backend_config",
        message: "Set CHURCH_TASK_CONVEX_URL to your Convex deployment URL.",
      },
    });
  });

  it("does not print secrets from environment or backend failures", async () => {
    const secret = "super-secret-token";
    const result = await runCli(["health"], {
      env: { CHURCH_TASK_CONVEX_URL: "https://steady-church-123.convex.cloud", TOKEN: secret },
      backendLayer: fakeBackend(
        Effect.fail(
          new BackendError({
            cause: `request failed with ${secret}`,
          }),
        ),
      ),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).not.toContain(secret);
    expect(JSON.parse(result.stderr)).toEqual({
      ok: false,
      error: {
        code: "backend_unavailable",
        message: "Backend health check failed.",
      },
    });
  });
});
