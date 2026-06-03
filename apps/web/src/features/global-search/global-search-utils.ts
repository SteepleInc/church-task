import type { GlobalSearchResult } from "@/features/global-search/global-search-types";

export const GLOBAL_SEARCH_SHORTCUT = "/";

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function filterGlobalSearchResults(
  results: readonly GlobalSearchResult[],
  searchValue: string,
): readonly GlobalSearchResult[] {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) return results;

  const searchTerms = normalizedSearch.split(/\s+/);

  return results.filter((result) => {
    const haystack = [result.title, result.description, result.type, ...result.keywords]
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) => haystack.includes(term));
  });
}
