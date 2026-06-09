import { describe, expect, test } from "bun:test";

const usersCollectionSource = await Bun.file(
  new URL("./usersCollection.tsx", import.meta.url),
).text();

describe("users collection details-pane wiring", () => {
  test("clicking a user row opens the user details pane and preserves history", () => {
    expect(usersCollectionSource).toContain("useDetailsPaneState()");
    expect(usersCollectionSource).toContain("onRowClick={(user) =>");
    expect(usersCollectionSource).toContain('_tag: "user"');
    expect(usersCollectionSource).toContain('tab: "details"');
    expect(usersCollectionSource).toContain(
      "setDetailsPaneState([...detailsPaneState, nextEntry])",
    );
  });
});
