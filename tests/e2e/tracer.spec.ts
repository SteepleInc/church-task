import { expect, test } from "@playwright/test";

test("tracer API creates a demo item through TanStack Start", async ({ request }) => {
  const health = await request.get("/api/tracer");
  await expect(health).toBeOK();

  const response = await request.post("/api/tracer/demo-items", {
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
