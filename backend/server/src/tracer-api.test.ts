import { getUserId } from "@church-task/shared/get-ids";
import { startPostgresHarness } from "@church-task/test-harness";
import { describe, expect, test } from "vitest";

import { createTracerApi } from "./tracer-api";

describe("tracer API", () => {
  test("creates a demo item through the Zero mutator path", async () => {
    const harness = await startPostgresHarness();
    const api = createTracerApi(harness.connectionString);

    try {
      const response = await api.fetch(
        new Request("http://127.0.0.1/api/tracer/demo-items", {
          body: JSON.stringify({ name: "Zero mutator tracer" }),
          headers: {
            "content-type": "application/json",
            "x-church-task-user-id": getUserId(),
          },
          method: "POST",
        }),
      );

      expect(response.ok).toBe(true);
      const body = (await response.json()) as { item?: { id?: string; name?: string } };

      expect(body.item?.id).toMatch(/^demoitem_/);
      expect(body.item?.name).toBe("Zero mutator tracer");
    } finally {
      await api.close();
      await harness.stop();
    }
  }, 60_000);
});
