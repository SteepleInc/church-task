"use client";

import { env } from "@church-task/env/web";
import { mutators, schema, type OptionalZeroSessionContext } from "@church-task/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";

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

  return configuredUrl;
};

const toBase64Url = (value: string | ArrayBuffer) => {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const createE2eZeroAuth = async (userId: string) => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      iat: Math.floor(Date.now() / 1000),
      sub: userId,
    }),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("church-task-e2e-zero-auth-secret"),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );

  return `${header}.${payload}.${toBase64Url(signature)}`;
};

export function ZeroRuntimeProvider(props: { readonly children: React.ReactNode }) {
  const { data, isPending: sessionPending } = authClient.useSession();
  const session = data?.session as SessionWithZeroContext | undefined;
  const userId = data?.user?.id;
  const [e2eAuth, setE2eAuth] = useState<string | undefined>();

  const activeChurchId = session?.activeOrganizationId ?? null;
  const sessionId = session?.id ?? data?.session?.id;
  const context: OptionalZeroSessionContext =
    sessionPending || !data?.user || !data.session || !userId || !sessionId
      ? null
      : {
          authenticated: true,
          active_church_id: activeChurchId,
          church_role: session?.orgRole ?? null,
          is_app_admin: session?.userRole === "admin",
          runtime: "client",
          session_id: sessionId,
          user_id: data.user.id,
        };

  useEffect(() => {
    if (import.meta.env.MODE !== "e2e" || !userId) {
      setE2eAuth(undefined);
      return;
    }

    let cancelled = false;
    void createE2eZeroAuth(userId).then((auth) => {
      if (!cancelled) setE2eAuth(auth);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (import.meta.env.MODE === "e2e" && userId && !e2eAuth) {
    return null;
  }

  return (
    <ZeroProvider
      auth={e2eAuth}
      cacheURL={getZeroCacheUrl()}
      context={context}
      key={`${userId ?? "anonymous"}:${sessionId ?? "anonymous"}:${activeChurchId ?? "none"}`}
      mutators={mutators}
      schema={schema}
      userID={e2eAuth ? userId : undefined}
    >
      {props.children}
    </ZeroProvider>
  );
}
