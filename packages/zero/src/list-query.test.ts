import { describe, expect, test } from "vitest";

import { applyZeroListQuery } from "./list-query";

class QuerySpy {
  readonly calls: Array<readonly unknown[]> = [];

  where(...args: readonly unknown[]) {
    this.calls.push(["where", ...args]);
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc") {
    this.calls.push(["orderBy", column, direction]);
    return this;
  }

  limit(limit: number) {
    this.calls.push(["limit", limit]);
    return this;
  }

  offset(offset: number) {
    this.calls.push(["offset", offset]);
    return this;
  }
}

describe("applyZeroListQuery", () => {
  test("applies text filters with ILIKE and snake_case list args", () => {
    const query = new QuerySpy();

    applyZeroListQuery(
      query,
      {
        filters: [{ column_id: "name", operator: "contains", type: "text", values: ["Grace"] }],
        limit: 25,
        order_by: "created_at",
        order_direction: "desc",
      },
      {
        allowed_columns: ["name", "created_at"],
        column_map: { created_at: "createdAt" },
        default_order_by: "created_at",
      },
    );

    expect(query.calls).toEqual([
      ["where", "name", "ILIKE", "%Grace%"],
      ["orderBy", "createdAt", "desc"],
      ["limit", 25],
    ]);
  });

  test("ignores filters and sorting for non-allowlisted columns", () => {
    const query = new QuerySpy();

    applyZeroListQuery(
      query,
      {
        filters: [{ column_id: "role", operator: "is", type: "option", values: ["admin"] }],
        order_by: "role",
      },
      { allowed_columns: ["name"], default_order_by: "name" },
    );

    expect(query.calls).toEqual([["orderBy", "name", "asc"]]);
  });
});
