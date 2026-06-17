export type TemplateCollectionItem = {
  readonly id: string;
  readonly name: string;
};

export function useTemplatesCollection() {
  const collection: readonly TemplateCollectionItem[] = [];

  return {
    loading: false,
    collection,
    templatesCollection: collection,
  };
}
