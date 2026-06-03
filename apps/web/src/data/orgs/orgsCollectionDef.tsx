import type { OrgCollectionItem } from "@/data/orgs/orgsData.app";
import type { CollectionColumnDef } from "@/components/collections/collection";

export const orgsColumnsDef: readonly CollectionColumnDef<OrgCollectionItem>[] = [
  {
    cell: (org) => org.name,
    className: "font-medium",
    header: "Name",
    id: "name",
  },
  {
    cell: (org) => org.slug,
    className: "text-muted-foreground",
    header: "Slug",
    id: "slug",
  },
  {
    cell: (org) => org.churchTimeZone ?? "Not set",
    className: "text-muted-foreground",
    header: "Time Zone",
    id: "churchTimeZone",
  },
  {
    cell: (org) => (org.completedOnboarding ? "Complete" : "Incomplete"),
    header: "Onboarding",
    id: "completedOnboarding",
  },
];

export const orgsFiltersDef = [] as const;
