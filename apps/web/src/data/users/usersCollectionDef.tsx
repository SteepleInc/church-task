import type { CollectionColumnDef } from "@/components/collections/collection";
import type { UserCollectionItem } from "@/data/users/usersData.app";

export const globalUsersTableColumns: readonly CollectionColumnDef<UserCollectionItem>[] = [
  {
    cell: (user) => user.name ?? "Unnamed user",
    className: "font-medium",
    header: "Name",
    id: "name",
  },
  {
    cell: (user) => user.email ?? "No email",
    className: "text-muted-foreground",
    header: "Email",
    id: "email",
  },
  {
    cell: (user) => user.role,
    header: "Role",
    id: "role",
  },
];

export const globalUsersFiltersDef = [] as const;
