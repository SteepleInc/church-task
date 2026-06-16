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

export function ZeroRuntimeProvider(props: { readonly children: React.ReactNode }) {
  const { data } = authClient.useSession();
  const session = data?.session as SessionWithZeroContext | undefined;
  const userId = data?.user?.id ?? "anonymous";
  const context: OptionalZeroSessionContext | null =
    data?.user && data.session
      ? {
          active_church_id: session?.activeOrganizationId ?? null,
          church_role: session?.orgRole ?? null,
          is_app_admin: session?.userRole === "admin",
          session_id: session?.id ?? data.session.id,
          user_id: data.user.id,
        }
      : null;

  return (
    <ZeroProvider
      cacheURL={env.VITE_ZERO_CACHE_URL ?? "http://127.0.0.1:4848"}
      context={context}
      mutators={mutators}
      schema={schema}
      userID={userId}
    >
      {props.children}
    </ZeroProvider>
  );
}
