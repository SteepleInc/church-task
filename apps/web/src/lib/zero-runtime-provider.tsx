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
  const { data } = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const session = data?.session as SessionWithZeroContext | undefined;
  const userId = data?.user?.id ?? "anonymous";
  const activeMember = activeOrganization?.members?.find((member) => member.userId === userId);
  const activeChurchId = activeOrganization?.id ?? session?.activeOrganizationId ?? null;
  const context: OptionalZeroSessionContext | null =
    data?.user && data.session
      ? {
          authenticated: true,
          active_church_id: activeChurchId,
          church_role: activeMember?.role ?? session?.orgRole ?? null,
          is_app_admin: session?.userRole === "admin",
          runtime: "client",
          session_id: session?.id ?? data.session.id,
          user_id: data.user.id,
        }
      : null;

  return (
    <ZeroProvider
      cacheURL={getZeroCacheUrl()}
      context={context}
      key={`${userId}:${session?.id ?? "anonymous"}:${activeChurchId ?? "none"}`}
      mutators={mutators}
      schema={schema}
      userID={userId}
    >
      {props.children}
    </ZeroProvider>
  );
}
