"use client";

import { useRouter } from "@tanstack/react-router";
import { createContext, type ReactNode, useContext, useEffect } from "react";

import { authClient } from "@/lib/auth-client";

type AuthProviderContextValue = {
  readonly isPending: boolean;
  readonly refetch: () => Promise<unknown>;
  readonly session: unknown;
};

const AuthProviderContext = createContext<AuthProviderContextValue>({
  isPending: true,
  refetch: () => Promise.resolve({}),
  session: null,
});

type AuthProviderProps = {
  readonly children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    router.update({
      context: {
        ...router.options.context,
        refetchSession: refetch,
        session,
        sessionPending: isPending,
      },
    });

    void router.invalidate();
  }, [isPending, refetch, router, session]);

  return (
    <AuthProviderContext.Provider value={{ isPending, refetch, session }}>
      {children}
    </AuthProviderContext.Provider>
  );
}

export function useAuthProviderSession() {
  return useContext(AuthProviderContext);
}
