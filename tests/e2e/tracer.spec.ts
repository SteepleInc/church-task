import { expect, test } from "@playwright/test";

import { startTracerHttpServer } from "@church-task/server";

const port = Number(process.env.E2E_TRACER_PORT ?? 2102);
const baseUrl = `http://127.0.0.1:${port}`;

let server: Awaited<ReturnType<typeof startTracerHttpServer>>;

test.beforeAll(async () => {
  server = await startTracerHttpServer(port);
}, 90_000);

test.afterAll(async () => {
  await server.stop();
});

test("tracer API creates a demo item through the local stack", async ({ request }) => {
  const health = await request.get(`${baseUrl}/api/tracer`);
  await expect(health).toBeOK();

  const response = await request.post(`${baseUrl}/api/tracer/demo-items`, {
    data: { name: "Playwright tracer item" },
    headers: {
      "x-church-task-user-id": "user_00000000000000000000000000",
    },
  });

  await expect(response).toBeOK();
  const body = (await response.json()) as { item?: { id?: string; name?: string } };

  expect(body.item?.id).toMatch(/^demoitem_/);
  expect(body.item?.name).toBe("Playwright tracer item");
});
