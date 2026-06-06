import { Collection } from "@/components/collections/collection";
import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";
import { globalUsersFiltersDef, globalUsersTableColumns } from "@/data/users/usersCollectionDef";
import { useChurchUsersCollection, type UserCollectionItem } from "@/data/users/usersData.app";
import { FilterKeys } from "@/shared/global-state";

type UsersCollectionProps = {
  readonly _tag: "global";
};

export function UsersCollection(props: UsersCollectionProps) {
  const { _tag } = props;

  if (_tag === "global") {
    return <GlobalUsersCollection />;
  }

  return null;
}

function GlobalUsersCollection() {
  const { currentOrgOpt: activeChurch } = useCurrentOrgOpt();
  const { loading, usersCollection } = useChurchUsersCollection({
    churchId: activeChurch?.id ?? null,
  });

  return (
    <Collection<UserCollectionItem>
      _tag="users"
      columnsDef={globalUsersTableColumns}
      data={usersCollection}
      filterColumnId="email"
      filterKey={FilterKeys.Users}
      filterPlaceHolder="Filter Members"
      filtersDef={globalUsersFiltersDef}
      getRowKey={(user) => user.memberId}
      getRowLabel={(user) => `Admin User ${user.name ?? user.email}`}
      loading={loading}
    />
  );
}
