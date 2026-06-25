import { isAppAdministratorSessionUser } from "@/data/users/adminData-utils";
import { useSession } from "@/hooks/use-session";

export function useIsAppAdmin() {
  const { session } = useSession();

  return isAppAdministratorSessionUser(session?.user);
}

export const useIsAdmin = useIsAppAdmin;
