export interface ZeroSessionContext {
  readonly authenticated: true;
  readonly active_church_id: string | null;
  readonly church_role: string | null;
  readonly is_app_admin: boolean;
  readonly runtime: "client" | "server";
  readonly session_id: string;
  readonly user_id: string;
}

export interface AnonymousServerZeroSessionContext {
  readonly authenticated: false;
  readonly runtime: "server";
}

export type OptionalZeroSessionContext =
  | AnonymousServerZeroSessionContext
  | ZeroSessionContext
  | null;

declare module "@rocicorp/zero" {
  interface DefaultTypes {
    context: OptionalZeroSessionContext;
  }
}

export const anonymousServerContext = (): AnonymousServerZeroSessionContext => ({
  authenticated: false,
  runtime: "server",
});

export const isAppAdminSession = (ctx: OptionalZeroSessionContext) =>
  ctx?.authenticated === true && ctx.is_app_admin === true;

export const hasActiveChurchAccess = (ctx: OptionalZeroSessionContext, church_id: string) =>
  ctx?.authenticated === true && (ctx.is_app_admin || ctx.active_church_id === church_id);

export const isServerContext = (ctx: OptionalZeroSessionContext) => ctx?.runtime === "server";

export const requireSignedInSession = (ctx: OptionalZeroSessionContext) => {
  if (ctx?.authenticated !== true) {
    throw new Error("Authentication required.");
  }

  return ctx;
};

export const requireAppAdminSession = (ctx: OptionalZeroSessionContext) => {
  const session = requireSignedInSession(ctx);

  if (!session.is_app_admin) {
    throw new Error("App Administrator access required.");
  }

  return session;
};

export const requireActiveChurchAccess = (ctx: OptionalZeroSessionContext, church_id: string) => {
  const session = requireSignedInSession(ctx);

  if (!session.is_app_admin && session.active_church_id !== church_id) {
    throw new Error("Active Church access required.");
  }

  return session;
};
