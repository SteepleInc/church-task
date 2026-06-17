import { env } from "@church-task/env/web";
import { mutators, schema, type OptionalZeroSessionContext } from "@church-task/zero";
import { ZeroProvider } from "@rocicorp/zero/react";

import { authClient } from "@/lib/auth-client";

type SessionWithZeroContext = {
  readonly activeOrganizationId?: string | null;
  readonly id: string;
  readonly orgRole?: string | null;
  readonly userRole?: string | null;
};

const getZeroCacheUrl = () => {
  const configuredUrl = env.VITE_ZERO_CACHE_URL;

  if (!configuredUrl) return "http://127.0.0.1:4848";

  return configuredUrl.includes("127.0.0.1") || configuredUrl.includes("localhost")
    ? `${typeof window === "undefined" ? "" : window.location.origin}/zero`
    : configuredUrl;
};

export function ZeroRuntimeProvider(props: { readonly children: React.ReactNode }) {
  if (typeof window === "undefined") return props.children;

  const { data, isPending: sessionPending } = authClient.useSession();
  const session = data?.session as SessionWithZeroContext | undefined;
  const userId = data?.user?.id;

  if (sessionPending || !data?.user || !data.session || !userId) {
    return props.children;
  }

  const activeChurchId = session?.activeOrganizationId ?? null;
  const context: OptionalZeroSessionContext = {
    authenticated: true,
    active_church_id: activeChurchId,
    church_role: session?.orgRole ?? null,
    is_app_admin: session?.userRole === "admin",
    runtime: "client",
    session_id: session?.id ?? data.session.id,
    user_id: data.user.id,
  };

  return (
    <ZeroProvider
      cacheURL={getZeroCacheUrl()}
      context={context}
      key={`${userId}:${session?.id ?? data.session.id}:${activeChurchId ?? "none"}`}
      mutators={mutators}
      schema={schema}
      userID={userId}
    >
      {props.children}
    </ZeroProvider>
  );
}
