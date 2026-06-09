import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { createUsersFiltersDef, usersColumnsDef } from "@/data/users/usersCollectionDef";
import type { UserCollectionItem } from "@/data/users/usersData.app";

const representativeUser = {
  id: "user_123",
  name: "Ada Lovelace",
  email: "ada@example.com",
  image: null,
  createdAt: Date.UTC(2026, 0, 2),
  churches: [{ id: "org_123", name: "Grace Church", role: "owner", slug: "grace" }],
} satisfies UserCollectionItem;

function renderCell(columnId: string, user: UserCollectionItem = representativeUser) {
  const column = usersColumnsDef.find((candidate) => candidate.id === columnId);

  if (!column || typeof column.cell !== "function") {
    throw new Error(`Missing cell renderer for ${columnId}`);
  }

  return renderToStaticMarkup(column.cell({ row: { original: user } } as never));
}

describe("users collection columns", () => {
  test("defines the admin users column set in order", () => {
    expect(usersColumnsDef.map((column) => column.id)).toEqual([
      "name",
      "email",
      "churches",
      "createdAt",
    ]);
  });

  test("renders representative name, email, churches, and created cells", () => {
    expect(renderCell("name")).toContain("Ada Lovelace");
    expect(renderCell("email")).toContain("ada@example.com");
    expect(renderCell("churches")).toContain("Grace Church");
    expect(renderCell("createdAt")).toContain("Jan 2, 2026");
  });

  test("builds name/email/churches filters", () => {
    const filters = createUsersFiltersDef([{ label: "Grace Church", value: "org_123" }]);

    expect(filters.map((filter) => filter.id)).toEqual(["name", "email", "churches"]);
    expect(filters.find((filter) => filter.id === "churches")?.options).toEqual([
      { label: "Grace Church", value: "org_123" },
    ]);
  });
});
