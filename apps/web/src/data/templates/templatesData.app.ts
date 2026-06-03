import type { Template } from "@church-task/domain";

import { collectionFromQueryResult } from "@/data/convex-query-adapter";

export type TemplateCollectionItem = Pick<Template, "id" | "name">;

export function useTemplatesCollection() {
  const state = collectionFromQueryResult<TemplateCollectionItem>([]);

  return {
    loading: false,
    collection: state.collection,
    templatesCollection: state.collection,
  };
}
