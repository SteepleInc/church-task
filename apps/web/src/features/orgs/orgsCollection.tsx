import { Collection } from "@/components/collections/collection";
import { orgsColumnsDef, orgsFiltersDef } from "@/data/orgs/orgsCollectionDef";
import { useUserOrgsCollection, type OrgCollectionItem } from "@/data/orgs/orgsData.app";

type OrgsCollectionProps = {
  readonly _tag: "global";
};

export function OrgsCollection(props: OrgsCollectionProps) {
  const { _tag } = props;

  if (_tag === "global") {
    return <GlobalOrgsCollection />;
  }

  return null;
}

function GlobalOrgsCollection() {
  const { loading, orgsCollection } = useUserOrgsCollection();

  return (
    <Collection<OrgCollectionItem>
      _tag="orgs"
      columnsDef={orgsColumnsDef}
      data={orgsCollection}
      filterColumnId="name"
      filterKey="orgs"
      filterPlaceHolder="Search organizations"
      filtersDef={orgsFiltersDef}
      getRowKey={(org) => org.id}
      getRowLabel={(org) => `Admin Church ${org.name}`}
      loading={loading}
    />
  );
}
