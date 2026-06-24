import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { MarketingShell } from "./-marketing-shell";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayoutComponent,
});

// The light marketing pages (home, pricing) share one persistent shell — a
// single scroll surface plus the Header — so the site chrome animates once and
// survives navigation between them without re-mounting. The library page brings
// its own dark shell, so it opts out and renders bare.
function MarketingLayoutComponent() {
  const isLibrary = useRouterState({
    select: (state) => state.location.pathname.startsWith("/library"),
  });

  if (isLibrary) {
    return <Outlet />;
  }

  return <MarketingShell />;
}
