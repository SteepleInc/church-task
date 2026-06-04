import type { LucideIcon } from "lucide-react";

export type GlobalSearchEntityType = "task" | "team" | "member" | "church" | "route";

export type GlobalSearchDetail = {
  readonly label: string;
  readonly value: string;
};

export type GlobalSearchResult = {
  readonly id: string;
  readonly type: GlobalSearchEntityType;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
  readonly actionText?: string;
  readonly details: readonly GlobalSearchDetail[];
};
