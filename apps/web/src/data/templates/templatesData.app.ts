import { collectionFromQueryResult } from "@/data/convex-query-adapter";

export type TemplateCollectionItem = {
  readonly id: string;
  readonly name: string;
};

export function useTemplatesCollection() {
  const state = collectionFromQueryResult<TemplateCollectionItem>([]);

  return {
    loading: false,
    collection: state.collection,
    templatesCollection: state.collection,
  };
}
