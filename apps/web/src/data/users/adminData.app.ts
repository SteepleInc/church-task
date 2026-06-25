import { isAppAdministratorSessionUser } from "@/data/users/adminData-utils";
import { useSession } from "@/hooks/use-session";

type SessionUserWithRole = {
  readonly role?: string | null;
};

export function useIsAppAdmin() {
  const { session } = useSession();

  return isAppAdministratorSessionUser((session as { user?: SessionUserWithRole } | null)?.user);
}

export const useIsAdmin = useIsAppAdmin;
