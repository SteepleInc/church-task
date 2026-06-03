import { api } from "@church-task/backend/convex/_generated/api";
import { useQuery } from "convex/react";

export function useOrgId() {
  const activeOrg = useQuery(api.dashboard.getActiveOrganization);

  return activeOrg?.id ?? "";
}
