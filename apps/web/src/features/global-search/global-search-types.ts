import type { LucideIcon } from "lucide-react";

export type GlobalSearchEntityType = "task" | "team" | "member" | "church" | "route";

export type GlobalSearchResult = {
  readonly id: string;
  readonly type: GlobalSearchEntityType;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
};
