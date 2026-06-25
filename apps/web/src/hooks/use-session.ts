import { useAuthProviderSession } from "@/components/auth-provider";

export function useSession() {
  const { isPending, refetch, session } = useAuthProviderSession();

  return {
    isPending,
    refetch,
    session,
  };
}
