import { Collection } from "@/components/collections/collection";
import { useDetailsPaneState } from "@/components/details-pane/details-pane-helpers";
import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { createUsersFiltersDef, usersColumnsDef } from "@/data/users/usersCollectionDef";
import {
  useAllUsersCollectionWithFilters,
  type UserCollectionItem,
} from "@/data/users/usersData.app";
import { FilterKeys } from "@/shared/global-state";
import { useMemo } from "react";

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
  const { canLoadMore, limit, loading, loadingMore, nextPage, pageSize, usersCollection } =
    useAllUsersCollectionWithFilters();
  const [detailsPaneState, setDetailsPaneState] = useDetailsPaneState();
  const churchOptions = useQuery(api.admin.listAllOrgOptions) ?? [];
  const filtersDef = useMemo(() => createUsersFiltersDef(churchOptions), [churchOptions]);

  return (
    <Collection<UserCollectionItem>
      _tag="users"
      canLoadMore={canLoadMore}
      columnPinning={{ left: ["name"] }}
      columnsDef={usersColumnsDef}
      data={usersCollection}
      filterColumnId="name"
      filterKey={FilterKeys.Users}
      filterPlaceHolder="Search users"
      filtersDef={filtersDef}
      getRowKey={(user) => user.id}
      getRowLabel={(user) => `Admin User ${user.name ?? user.email}`}
      limit={limit}
      loading={loading}
      loadingMore={loadingMore}
      nextPage={nextPage}
      onRowClick={(user) => {
        const nextEntry = { _tag: "user" as const, id: user.id, tab: "details" as const };
        const currentEntry = detailsPaneState.at(-1);

        if (currentEntry?._tag === "user" && currentEntry.id === user.id) {
          return;
        }

        setDetailsPaneState([...detailsPaneState, nextEntry]);
      }}
      pageSize={pageSize}
    />
  );
}
