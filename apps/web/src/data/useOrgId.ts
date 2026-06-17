import { useCurrentOrgOpt } from "@/data/orgs/orgData.app";

export function useOrgId() {
  const { currentOrgOpt: activeOrg } = useCurrentOrgOpt();

  return activeOrg?.id ?? "";
}
