import { describe, expect, test } from "bun:test";

const collectionSource = await Bun.file(new URL("./collection.tsx", import.meta.url)).text();
const tableViewSource = await Bun.file(
  new URL("./collectionTableView.tsx", import.meta.url),
).text();
const cardViewSource = await Bun.file(
  new URL("./defaultCollectionCard.tsx", import.meta.url),
).text();

describe("collection row-click behavior", () => {
  test("passes row click handlers through table and card views without hijacking controls", () => {
    expect(collectionSource).toContain("readonly onRowClick?: (item: TItem) => void");
    expect(tableViewSource).toContain("onRowClick(row.original)");
    expect(cardViewSource).toContain("onClick(row.original)");
    expect(tableViewSource).toContain("isInteractiveTarget(event.target)");
    expect(cardViewSource).toContain("isInteractiveTarget(event.target)");
  });
});
